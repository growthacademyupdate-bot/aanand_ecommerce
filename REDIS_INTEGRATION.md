# Redis Caching Integration Documentation

## Overview
This document describes the Redis caching integration for the Morpankh Saree e-commerce application. Redis is used as a cache layer between the application and MongoDB database to improve performance for frequently accessed data.

## Installation

### Dependencies
```bash
npm install ioredis
```

### Environment Variables
Add the following to your `.env` file:
```env
REDIS_URL=redis://localhost:6379
```

For production, use a Redis cloud service URL:
```env
REDIS_URL=redis://your-redis-cloud-url
```

## Cache Strategy

### Cache Keys
- `products:list` - All products list
- `product:{slug}` - Individual product by slug (e.g., `product:vintage-floral-grace`)
- `categories:list` - Categories with product counts
- `products:featured` - Featured products list

### TTL (Time To Live) Strategy
- **Products list**: 5 minutes (300 seconds) - Stock changes frequently
- **Product details**: 10 minutes (600 seconds) - Individual product data changes less often
- **Categories**: 30 minutes (1800 seconds) - Categories rarely change
- **Featured products**: 10 minutes (600 seconds) - Featured status changes occasionally

## Implementation Details

### Redis Service (`src/lib/redis.ts`)
The Redis service provides:
- Connection management with automatic reconnection
- Error handling - application continues to work if Redis is unavailable
- Cache-aside pattern implementation
- Helper functions for cache invalidation

### Cached API Endpoints

#### 1. Product Listings
**Endpoint**: `GET /api/products`
- **Cache Key**: `products:list`
- **TTL**: 300 seconds (5 minutes)
- **Invalidation**: On product create, update, delete

#### 2. Product Details
**Endpoint**: `GET /api/product/[slug]`
- **Cache Key**: `product:{slug}`
- **TTL**: 600 seconds (10 minutes)
- **Invalidation**: On product create, update, delete

#### 3. Categories
**Endpoint**: `GET /api/categories`
- **Cache Key**: `categories:list`
- **TTL**: 1800 seconds (30 minutes)
- **Invalidation**: On category create, update, delete

#### 4. Featured Products
**Endpoint**: `GET /api/products/featured`
- **Cache Key**: `products:featured`
- **TTL**: 600 seconds (10 minutes)
- **Invalidation**: On product create, update, delete

### Cache Invalidation

#### Product Operations
- **Create** (`POST /api/admin/products`): Invalidates `products:list`, `products:featured`, and `product:{slug}`
- **Update** (`PUT /api/admin/products/[id]`): Invalidates `products:list`, `products:featured`, and `product:{slug}`
- **Delete** (`DELETE /api/admin/products/[id]`): Invalidates `products:list`, `products:featured`, and `product:{slug}`

#### Category Operations
- **Create** (`POST /api/admin/categories`): Invalidates `categories:list`, `products:list`, `products:featured`
- **Update** (`PUT /api/admin/categories/[id]`): Invalidates `categories:list`, `products:list`, `products:featured`
- **Delete** (`DELETE /api/admin/categories/[id]`): Invalidates `categories:list`, `products:list`, `products:featured`

## Example API Requests and Responses

### Cache Hit Example

**First Request (Cache Miss):**
```bash
GET /api/products
```

**Console Output:**
```
[Redis] Cache MISS for key: products:list
[Redis] Connected successfully
```

**Response Time:** ~200ms (database query)

**Second Request (Cache Hit):**
```bash
GET /api/products
```

**Console Output:**
```
[Redis] Cache HIT for key: products:list
```

**Response Time:** ~5ms (from Redis cache)

### Cache Miss Example (After Invalidation)

**Create a new product:**
```bash
POST /api/admin/products
{
  "name": "New Saree",
  "slug": "new-saree",
  "sku": "SKU123",
  "barcode": "BAR123",
  "category": "sarees",
  "price": 2999,
  "comparePrice": 3999,
  "colors": [
    {
      "colorName": "Red",
      "stock": 10,
      "images": ["image1.jpg"]
    }
  ]
}
```

**Console Output:**
```
[Redis] Product cache invalidated
```

**Next request to /api/products:**
```bash
GET /api/products
```

**Console Output:**
```
[Redis] Cache MISS for key: products:list
[Redis] Connected successfully
```

**Response:** Updated product list with new product

## Error Handling

The Redis service includes comprehensive error handling:

1. **Redis Unavailable**: If Redis is not configured or connection fails, the application continues to work by falling back to the database
2. **Connection Errors**: Automatic reconnection with retry strategy
3. **Cache Failures**: If cache operations fail, the application still serves data from the database

**Example error logs:**
```
[Redis] REDIS_URL not configured, caching disabled
[Redis] Connection error: connect ECONNREFUSED
[Redis] Max retries reached, disabling cache
```

## Monitoring

### Cache Hit Rate
Monitor cache hit rate to ensure caching is effective:
- High hit rate (>80%): Good caching strategy
- Low hit rate (<50%): Consider adjusting TTL or cache keys

### Redis Memory Usage
Monitor Redis memory usage to ensure adequate capacity:
```bash
redis-cli INFO memory
```

### Cache Size
Check cache size:
```bash
redis-cli DBSIZE
```

## Testing

### Manual Testing Steps

1. **Start Redis:**
```bash
redis-server
```

2. **Start the application:**
```bash
npm run dev
```

3. **Test product listings:**
```bash
curl http://localhost:3000/api/products
```

4. **Test product details:**
```bash
curl http://localhost:3000/api/product/vintage-floral-grace
```

5. **Test categories:**
```bash
curl http://localhost:3000/api/categories
```

6. **Test featured products:**
```bash
curl http://localhost:3000/api/products/featured
```

7. **Test cache invalidation:**
   - Create a new product via admin panel
   - Immediately fetch products list
   - Verify cache miss in console logs

### Automated Testing
Add tests to verify:
- Cache hit behavior
- Cache miss behavior
- Cache invalidation on CRUD operations
- Fallback to database when Redis is unavailable

## Production Considerations

### Redis Configuration
For production, configure Redis with:
- Persistence (RDB/AOF)
- Memory limits
- Eviction policy (allkeys-lru)
- Password authentication
- TLS/SSL encryption

### Example Production Redis URL:
```env
REDIS_URL=rediss://:password@redis-cloud-host:6379
```

### Monitoring
Set up monitoring for:
- Redis connection status
- Cache hit/miss ratio
- Redis memory usage
- Response times

## Troubleshooting

### Issue: Cache not working
**Solution:**
1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_URL in .env file
3. Check console logs for Redis errors

### Issue: Stale data
**Solution:**
1. Verify cache invalidation is called on CRUD operations
2. Check TTL values are appropriate
3. Manually flush Redis: `redis-cli FLUSHALL`

### Issue: High memory usage
**Solution:**
1. Reduce TTL values
2. Implement cache eviction policy
3. Monitor and optimize cache size

## Files Modified

1. **src/lib/redis.ts** - New Redis service with error handling
2. **src/app/api/products/route.ts** - Added caching for product listings
3. **src/app/api/product/[slug]/route.ts** - Added caching for product details
4. **src/app/api/categories/route.ts** - Added caching for categories
5. **src/app/api/products/featured/route.ts** - New endpoint for featured products with caching
6. **src/app/api/admin/products/route.ts** - Added cache invalidation on product creation
7. **src/app/api/admin/products/[id]/route.ts** - Added cache invalidation on product update/delete
8. **src/app/api/admin/categories/route.ts** - Added cache invalidation on category creation
9. **src/app/api/admin/categories/[id]/route.ts** - Added cache invalidation on category update/delete
10. **.env** - Added REDIS_URL environment variable
11. **package.json** - Added ioredis dependency

## Summary

The Redis caching integration provides:
- ✅ Improved performance for frequently accessed data
- ✅ Automatic cache invalidation on data changes
- ✅ Graceful fallback when Redis is unavailable
- ✅ Configurable TTL for different data types
- ✅ Comprehensive error handling
- ✅ Easy to monitor and debug

The application will continue to work normally even if Redis is unavailable, making this a safe and reliable caching solution.
