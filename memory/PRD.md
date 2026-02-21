# Digital Products & OTT Subscription Store - PRD

## Project Overview
A clean, minimal shopping website for selling digital product subscriptions (OTT services like Netflix, Spotify + software tools like Canva, ChatGPT, etc.)

## Design
- Theme: White and Purple
- Style: Smooth, beautiful, unique, minimal design
- Responsive: Mobile-first design

## Features Implemented

### Homepage
- [x] Hero banner with bold headline and clear CTA
- [x] Trust signals bar: "5000+ Tools Sold", "100% Satisfaction", "Instant Delivery"
- [x] Product listing grid with thumbnails, names, prices, and badges
- [x] Search bar to find products by name
- [x] Filters by category (OTT/Software), availability
- [x] Sale countdown timer on limited-time offers

### Product Details Page
- [x] Product image/logo, description, and features
- [x] Subscription duration dropdown (1, 3, 6, 9, 12 months)
- [x] Dynamic price display with discount badge
- [x] "Buy Now" button for checkout
- [x] "Order via WhatsApp" button with pre-filled message
- [x] Out-of-stock label when unavailable

### Authentication
- [x] Normal sign-in with email/password (not Google OAuth)
- [x] Login/Signup pages
- [x] Role-based access (admin vs customer)
- [x] Forgot password with OTP (demo mode)

### Customer Dashboard
- [x] View order history
- [x] Account details

### Admin Panel
- [x] Product management (add/edit/delete with photo URL)
- [x] Pricing management per duration
- [x] Toggle product status (Active/Out of Stock)
- [x] Sale timer management
- [x] User management
- [x] Order management with status updates

### Payments
- [x] Payment placeholder (ready for Razorpay integration later)
- [x] WhatsApp fallback for orders

## Technical Stack
- Frontend: Next.js 14 with React
- Styling: Tailwind CSS + shadcn/ui
- Backend: Next.js API Routes
- Database: MongoDB
- Authentication: JWT tokens

## Configuration
- Admin Email: parwal111@gmail.com
- WhatsApp Number: +919522349098
- Company Email: hello@discountontools.com

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/products (with filters)
- GET /api/products/:id
- POST /api/orders
- GET /api/orders
- GET /api/admin/orders
- PUT /api/admin/orders/:id
- POST /api/admin/products
- PUT /api/admin/products/:id
- DELETE /api/admin/products/:id
- GET /api/admin/users
- GET /api/admin/stats

## Future Enhancements
- [ ] Razorpay payment integration
- [ ] Email service integration for OTP
- [ ] Product image upload to cloud storage
- [ ] Email notifications for orders
