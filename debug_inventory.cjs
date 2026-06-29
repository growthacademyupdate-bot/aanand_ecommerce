const { MongoClient } = require('mongodb');

async function debugInventory() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    
    console.log('=== CONNECTED TO MONGODB ===');
    console.log('URI:', uri);
    console.log('');
    
    // List all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    console.log('=== AVAILABLE DATABASES ===');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (size: ${db.sizeOnDisk})`);
    });
    console.log('');
    
    // Try to determine the correct database name
    let dbName = 'morepankh_6th_may';
    if (uri.includes('/')) {
      const parts = uri.split('/');
      const lastPart = parts[parts.length - 1];
      dbName = lastPart.split('?')[0];
    }
    
    console.log('=== USING DATABASE ===');
    console.log('Database Name:', dbName);
    console.log('');
    
    // If the database doesn't exist, try 'e-commerce' as a fallback
    const dbExists = databases.databases.some(d => d.name === dbName);
    if (!dbExists) {
      console.log('Database', dbName, 'does not exist. Trying "e-commerce"...');
      dbName = 'e-commerce';
    }
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('=== COLLECTIONS IN DATABASE ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    console.log('');
    
    // Count total products
    const totalCount = await db.collection('products').countDocuments();
    console.log('=== TOTAL PRODUCTS ===');
    console.log('Count:', totalCount);
    console.log('');
    
    // Check for dress products (formType: 'dress')
    console.log('=== CHECKING FOR DRESS PRODUCTS ===');
    const dressCount = await db.collection('products').countDocuments({ formType: 'dress' });
    console.log('Products with formType=dress:', dressCount);
    
    if (dressCount > 0) {
      const dressProduct = await db.collection('products').findOne({ formType: 'dress' });
      console.log('\n=== DRESS PRODUCT FOUND ===');
      console.log('Product Name:', dressProduct.name);
      console.log('Form Type:', dressProduct.formType);
      console.log('Category:', dressProduct.category);
      console.log('\n=== COLORS ===');
      console.log(JSON.stringify(dressProduct.colors, null, 2));
    }
    
    // Check for products with hasSizes
    console.log('\n=== CHECKING FOR PRODUCTS WITH HASSIZES ===');
    const hasSizesCount = await db.collection('products').countDocuments({ 'colors.hasSizes': true });
    console.log('Products with hasSizes=true:', hasSizesCount);
    
    if (hasSizesCount > 0) {
      const hasSizesProduct = await db.collection('products').findOne({ 'colors.hasSizes': true });
      console.log('\n=== PRODUCT WITH HASSIZES ===');
      console.log('Product Name:', hasSizesProduct.name);
      console.log('Form Type:', hasSizesProduct.formType);
      console.log('\n=== COLORS ===');
      console.log(JSON.stringify(hasSizesProduct.colors, null, 2));
    }
    
    // If no dress products, create a test dress product
    if (dressCount === 0 && hasSizesCount === 0) {
      console.log('\n=== NO DRESS PRODUCTS FOUND - CREATING TEST PRODUCT ===');
      
      const testProduct = {
        name: 'Test Dress Product',
        slug: 'test-dress-product',
        sku: 'TEST-DRESS-001',
        barcode: 'TEST-BARCODE-001',
        category: 'dress',
        price: 999,
        comparePrice: 1299,
        stock: 40,
        colors: [
          {
            colorName: 'Red',
            colorImage: 'https://via.placeholder.com/100',
            stock: 20,
            hasSizes: true,
            sizes: {
              s: 10,
              m: 0,
              l: 0,
              xl: 10,
              xxl: 0,
              xxxl: 0,
              free: 0
            }
          },
          {
            colorName: 'Blue',
            colorImage: 'https://via.placeholder.com/100',
            stock: 20,
            hasSizes: true,
            sizes: {
              s: 0,
              m: 0,
              l: 0,
              xl: 0,
              xxl: 10,
              xxxl: 0,
              free: 10
            }
          }
        ],
        formType: 'dress',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('products').insertOne(testProduct);
      console.log('Test dress product created with ID:', result.insertedId.toString());
      console.log('\n=== TEST PRODUCT COLORS ===');
      console.log(JSON.stringify(testProduct.colors, null, 2));
    }
    
  } catch (error) {
    console.error('ERROR:', error);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

debugInventory();
