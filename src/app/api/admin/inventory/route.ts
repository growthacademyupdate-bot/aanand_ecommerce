import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId, WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface ProductColor {
  colorName: string;
  stock?: number;
  images?: string[];
  hasSizes?: boolean;
  sizes?: {
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
    free: number;
  };
}

interface Product {
  _id: ObjectId;
  name: string;
  sku?: string;
  colors?: string[] | ProductColor[];
}

let db: Db;

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

// Generate unique SKU for variants
function generateVariantSKU(productSku: string, colorName: string): string {
  const colorCode = colorName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${productSku}-${colorCode}`;
}

// Calculate total stock from all variants
function calculateTotalStock(colors: string[] | ProductColor[]): number {
  if (!Array.isArray(colors)) return 0;
  return colors.reduce((sum: number, color) => {
    const stock = typeof color === 'string' ? 0 : (Number(color.stock) || 0);
    return sum + stock;
  }, 0);
}

// GET - Fetch all inventory items (variants)
export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 50));
    const search = searchParams.get('search')?.trim() || '';

    const database = await getDatabase();

    // Build search filter
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { 'colors.colorName': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await database.collection('products').countDocuments(filter);

    const skip = (page - 1) * pageSize;
    const products = await database
      .collection('products')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    // Transform products into inventory items (flatten variants)
    const inventoryItems = products.flatMap((product: WithId<Document>) => {
      const colors = Array.isArray(product.colors) ? product.colors : [];
      return colors.map((color: string | ProductColor, index: number) => {
        const colorName = typeof color === 'string' ? color : color.colorName;
        const stock = typeof color === 'string' ? 0 : (Number(color.stock) || 0);
        const variantSku = generateVariantSKU(product.sku || '', colorName);
        
        console.log('🔍 INVENTORY DEBUG:', {
          productId: product._id.toString(),
          productName: product.name,
          variant: colorName,
          variantSku,
          stock,
          colorIndex: index
        });

        const hasSizes = typeof color === 'object' ? color.hasSizes : false;
        const sizes = typeof color === 'object' ? color.sizes : undefined;

        return {
          _id: `${product._id.toString()}-${colorName.replace(/\s+/g, '-').toLowerCase()}`,
          productId: product._id.toString(),
          productName: product.name,
          variant: colorName,
          sku: variantSku,
          stock: stock,
          hasSizes: hasSizes,
          sizes: sizes,
          productSku: product.sku || '',
          images: typeof color === 'object' && color.images ? color.images : [],
          variantIndex: index
        };
      });
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: inventoryItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// PUT - Update variant stock
export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variant, change, absoluteStock, size } = body;

    console.log('📦 STOCK UPDATE REQUEST:', {
      productId,
      variant,
      change,
      absoluteStock,
      size,
      body
    });

    if (!productId || !variant) {
      return NextResponse.json(
        { success: false, error: 'Product ID and variant name are required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
    }

    const database = await getDatabase();

    // Find the product
    const product = await database
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Find the variant index
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const variantIndex = colors.findIndex((color: string | ProductColor) => {
      const colorName = typeof color === 'string' ? color : color.colorName;
      return colorName === variant;
    });

    if (variantIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Variant '${variant}' not found` },
        { status: 404 }
      );
    }

    // Update the specific variant stock
    const currentVariant = colors[variantIndex];
    
    // Handle size-specific updates
    if (size && typeof currentVariant === 'object' && currentVariant.hasSizes && currentVariant.sizes) {
      const currentSizeStock = Number(currentVariant.sizes[size] || 0);
      
      let newSizeStock: number;
      if (typeof absoluteStock === 'number') {
        newSizeStock = Math.max(0, absoluteStock);
      } else if (typeof change === 'number') {
        newSizeStock = Math.max(0, currentSizeStock + change);
      } else {
        return NextResponse.json(
          { success: false, error: 'Either change or absoluteStock must be provided' },
          { status: 400 }
        );
      }

      console.log('🔄 SIZE STOCK UPDATE DETAILS:', {
        productId,
        variant,
        size,
        variantIndex,
        currentSizeStock,
        change,
        absoluteStock,
        newSizeStock
      });

      // Update the specific size stock
      const updateResult = await database
        .collection('products')
        .updateOne(
          { _id: new ObjectId(productId) },
          { 
            $set: { 
              [`colors.${variantIndex}.sizes.${size}`]: newSizeStock,
              updatedAt: new Date()
            } 
          }
        );

      if (updateResult.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      // Recalculate color stock from all sizes
      const updatedProduct = await database
        .collection('products')
        .findOne({ _id: new ObjectId(productId) });

      const updatedVariant = updatedProduct?.colors?.[variantIndex];
      if (updatedVariant && typeof updatedVariant === 'object' && updatedVariant.sizes) {
        const newColorStock = Object.values(updatedVariant.sizes).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        
        await database
          .collection('products')
          .updateOne(
            { _id: new ObjectId(productId) },
            { 
              $set: { 
                [`colors.${variantIndex}.stock`]: newColorStock,
                updatedAt: new Date()
              } 
            }
          );

        console.log('✅ SIZE STOCK UPDATE COMPLETED:', {
          productId,
          variant,
          size,
          variantIndex,
          oldSizeStock: currentSizeStock,
          newSizeStock,
          newColorStock,
          updateResult
        });

        // Calculate and update total product stock
        const totalStock = calculateTotalStock(updatedProduct?.colors || []);

        await database
          .collection('products')
          .updateOne(
            { _id: new ObjectId(productId) },
            { $set: { stock: totalStock, updatedAt: new Date() } }
          );

        return NextResponse.json({
          success: true,
          data: {
            productId,
            variant,
            size,
            variantIndex,
            oldSizeStock: currentSizeStock,
            newSizeStock,
            newColorStock,
            totalStock,
            message: `Size ${size.toUpperCase()} stock updated for ${variant}: ${currentSizeStock} → ${newSizeStock} (Color total: ${newColorStock})`
          }
        });
      }
    }
    
    // Handle color-level updates (no size specified)
    const currentStock = typeof currentVariant === 'string' ? 0 : (Number(currentVariant.stock) || 0);
    
    let newStock: number;
    if (typeof absoluteStock === 'number') {
      newStock = Math.max(0, absoluteStock);
    } else if (typeof change === 'number') {
      newStock = Math.max(0, currentStock + change);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either change or absoluteStock must be provided' },
        { status: 400 }
      );
    }

    console.log('🔄 COLOR STOCK UPDATE DETAILS:', {
      productId,
      variant,
      variantIndex,
      currentStock,
      change,
      absoluteStock,
      newStock
    });

    // Update the variant stock using positional operator
    const updateResult = await database
      .collection('products')
      .updateOne(
        { _id: new ObjectId(productId) },
        { 
          $set: { 
            [`colors.${variantIndex}.stock`]: newStock,
            updatedAt: new Date()
          } 
        }
      );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Calculate and update total product stock
    const updatedProduct = await database
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });

    const totalStock = calculateTotalStock(updatedProduct?.colors || []);

    await database
      .collection('products')
      .updateOne(
        { _id: new ObjectId(productId) },
        { $set: { stock: totalStock, updatedAt: new Date() } }
      );

    console.log('✅ COLOR STOCK UPDATE COMPLETED:', {
      productId,
      variant,
      variantIndex,
      oldStock: currentStock,
      newStock,
      totalStock,
      updateResult
    });

    return NextResponse.json({
      success: true,
      data: {
        productId,
        variant,
        variantIndex,
        oldStock: currentStock,
        newStock,
        totalStock,
        message: `Stock updated for ${variant}: ${currentStock} → ${newStock}`
      }
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}
