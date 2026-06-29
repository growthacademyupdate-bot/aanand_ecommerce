# Morpankh Saree E-Commerce Platform

## 🚀 Project Overview


The project provides shop/storefront features (product listing, cart, checkout, orders) plus admin management (product/category/inventory/order reports). It supports authentication, OTP, coupon/discount, wishlist, reviews, payment gateway (Razorpay), image upload + proxy, and maintenance mode.


## 🧩 Backend Functionality (API)

### Authentication
- Register user (`POST /api/auth/register`)
- Login (`POST /api/auth/login`)
- OTP verify (`POST /api/auth/verify-otp`)
- Resend OTP (`POST /api/auth/resend-otp`)
- Refresh JWT (`POST /api/auth/refresh-token`)
- Forgot password (`POST /api/auth/forgot-password`)
- Reset password (`POST /api/auth/reset-password`)
- Logout (`POST /api/auth/logout`)

### Product & Category Browsing
- List products (`GET /api/products`)
- Get product by ID (`GET /api/products/:id`)
- Get product by slug (`GET /api/products/slug/:slug`)
- List categories (`GET /api/categories`)
- Get category detail (`GET /api/categories/:id`)
- Banners (`GET /api/banners`)

### Cart & Wishlist
- Cart operations: get/add/update/remove/clear (`/api/cart`)
- Wishlist operations: get/add/remove (`/api/wishlist`)

### Orders
- Create order (`POST /api/orders`)
- Create with payment (`POST /api/orders/create-with-payment`)
- Search order by number (`GET /api/orders/number/:orderNumber`)
- Get order by ID (`GET /api/orders/:id`)
- Get orders list (`GET /api/orders`)

### Coupons & Reviews
- Validate coupon (`POST /api/coupons/validate`)
- Reviews: list by product (`GET /api/reviews/product/:productId`)
- Add review (auth required) (`POST /api/reviews`)

### Inventory
- Product stock lookup (`GET /api/inventory/lookup`)
- Product variant stock (`GET /api/inventory/product/:productId/variants`)
- Scan stock register (`POST /api/inventory/scan`)
- Stock logs (`GET /api/inventory/logs`)
- Low-stock list (`GET /api/inventory/low-stock`)

### Payment (Razorpay)
- Create order (`POST /api/payments/razorpay/create-order`)
- Verify payment (`POST /api/payments/razorpay/verify`)
- Webhook endpoint (`POST /api/payments/razorpay/webhook`)
- Check payment status (`GET /api/payments/:orderId/status`)

### Contact & Settings
- Contact form submissions (`POST /api/contact`)
- Public settings fetch (`GET /api/settings`)
- Setting read/update (`GET/PUT /api/settings/:key`)

### Admin API
- Admin auth (same as `/api/auth` + admin role checks)
- Products CRUD (`/api/admin/products`)
- Categories CRUD, images (`/api/admin/categories`)
- Banners CRUD (`/api/admin/banners`)
- Orders: list, detail, bulk status, print bill, delete (`/api/admin/orders`)
- Dashboard metrics (`GET /api/admin/dashboard/stats`)
- Export: orders/inventory/stock logs/business report (`/api/admin/export/**`)
- SMTP config and test (`/api/admin/settings/smtp`)
- Maintenance mode flag (`/api/admin/settings/maintenance`)

### Supporting middleware
- CORS origin validation
- Rate limiting (general and admin-specific)
- Maintenance mode check for shopping routes
- Compression, security headers (helmet)
- File serving from `/uploads`
- Health checks (`/health`, `/health/db`)

---

## 🎯 Frontend Functionality

### Public storefront pages
- Homepage with hero carousel, featured categories, best sellers, new arrivals, sale products, trending sections
- Product listing and filtering (`/products`) with search and category URL query
- Product detail page with variants, add-to-cart, description, reviews
- Category page (`/categories/[id]`) with paging
- Contact page (`/contact`)
- Faq/terms/privacy/shipping/refund pages
- Search sitemap and SEO metadata using structured data

### User account flows
- Register and login forms with OTP/email flows
- Forgot password / reset password / verify OTP
- Profile page: view/edit profile details
- Address book: add/update/delete addresses with default handling
- Order tracking: order history and detail pages
- Cart and checkout workflow
- Payment via Razorpay checkout integration
- Order success page (`/order-success`)
- Wishlist interactions
- Save and restore cart + quick actions

### Admin panel (likely under `/admin`)
- Product management: add/update/delete product, images, variants
- Category management: create/edit/delete categories + images
- Banner management
- Order management and status updates
- Dashboard charts and metrics
- Settings: maintenance, SMTP tests etc.
