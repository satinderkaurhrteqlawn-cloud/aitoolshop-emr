import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, verifyToken, hashPassword, comparePassword, isAdmin, getTokenFromRequest } from '@/lib/auth';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Auth middleware
async function authenticate(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

// Admin check middleware
async function requireAdmin(request) {
  const user = await authenticate(request);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';
  const { searchParams } = new URL(request.url);
  const db = await getDb();

  try {
    // Health check
    if (path === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // Get all products (public)
    if (path === 'products') {
      const category = searchParams.get('category');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');

      let query = {};
      if (category && category !== 'all') query.category = category;
      if (status === 'instock') query.status = 'active';
      if (status === 'outofstock') query.status = 'out_of_stock';
      if (search) query.name = { $regex: search, $options: 'i' };

      const products = await db.collection('products').find(query).sort({ createdAt: -1 }).toArray();
      
      // Filter by price range if specified
      let filteredProducts = products;
      if (minPrice || maxPrice) {
        filteredProducts = products.filter(p => {
          const lowestPrice = Math.min(...Object.values(p.pricing || {}).filter(v => v > 0));
          if (minPrice && lowestPrice < parseFloat(minPrice)) return false;
          if (maxPrice && lowestPrice > parseFloat(maxPrice)) return false;
          return true;
        });
      }

      return NextResponse.json(filteredProducts, { headers: corsHeaders });
    }

    // Get single product
    if (path.startsWith('products/')) {
      const productId = path.split('/')[1];
      const product = await db.collection('products').findOne({ id: productId });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json(product, { headers: corsHeaders });
    }

    // Get user profile
    if (path === 'profile') {
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      const userData = await db.collection('users').findOne({ id: user.id });
      if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }
      const { password, ...safeUser } = userData;
      return NextResponse.json(safeUser, { headers: corsHeaders });
    }

    // Get user orders
    if (path === 'orders') {
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      const orders = await db.collection('orders').find({ userId: user.id }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(orders, { headers: corsHeaders });
    }

    // Admin: Get all orders
    if (path === 'admin/orders') {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(orders, { headers: corsHeaders });
    }

    // Admin: Get all users
    if (path === 'admin/users') {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
      const safeUsers = users.map(({ password, ...u }) => u);
      return NextResponse.json(safeUsers, { headers: corsHeaders });
    }

    // Admin: Get stats
    if (path === 'admin/stats') {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      const totalProducts = await db.collection('products').countDocuments();
      const totalUsers = await db.collection('users').countDocuments();
      const totalOrders = await db.collection('orders').countDocuments();
      const orders = await db.collection('orders').find({ status: 'completed' }).toArray();
      const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      
      return NextResponse.json({ totalProducts, totalUsers, totalOrders, totalRevenue }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';
  const db = await getDb();

  try {
    // Seed demo products - no body needed
    if (path === 'seed') {
      const existingProducts = await db.collection('products').countDocuments();
      if (existingProducts > 0) {
        return NextResponse.json({ message: 'Products already seeded' }, { headers: corsHeaders });
      }

      const demoProducts = [
        {
          id: uuidv4(),
          name: 'Netflix Premium',
          description: 'Watch unlimited movies, TV shows, and more on Netflix Premium. Stream on 4 devices simultaneously in Ultra HD.',
          category: 'OTT',
          image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
          features: ['4K Ultra HD', '4 Screens', 'Download & Watch Offline', 'No Ads'],
          pricing: { 1: 199, 3: 549, 6: 999, 9: 1399, 12: 1799 },
          salePrice: { 1: 149, 3: 449, 6: 849, 9: 1199, 12: 1499 },
          saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Spotify Premium',
          description: 'Listen to millions of songs and podcasts without ads. Download music for offline listening.',
          category: 'OTT',
          image: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
          features: ['Ad-free Music', 'Offline Downloads', 'High Quality Audio', 'Listen Anywhere'],
          pricing: { 1: 119, 3: 329, 6: 599, 9: 849, 12: 1099 },
          salePrice: null,
          saleEndDate: null,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'ChatGPT Plus',
          description: 'Access to GPT-4, faster response times, and priority access during peak hours.',
          category: 'Software',
          image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
          features: ['GPT-4 Access', 'Faster Responses', 'Priority Access', 'New Features First'],
          pricing: { 1: 1499, 3: 4299, 6: 8299, 9: 0, 12: 15999 },
          salePrice: { 1: 1299, 3: 3799, 6: 7499, 9: 0, 12: 13999 },
          saleEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Canva Pro',
          description: 'Create stunning designs with premium templates, brand kit, and advanced features.',
          category: 'Software',
          image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg',
          features: ['Premium Templates', 'Brand Kit', 'Background Remover', 'Resize Magic'],
          pricing: { 1: 499, 3: 1399, 6: 2599, 9: 3699, 12: 4599 },
          salePrice: null,
          saleEndDate: null,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Amazon Prime',
          description: 'Get free delivery, Prime Video, Prime Music, and exclusive deals with Amazon Prime.',
          category: 'OTT',
          image: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazon_Prime_Logo.svg',
          features: ['Free Delivery', 'Prime Video', 'Prime Music', 'Exclusive Deals'],
          pricing: { 1: 0, 3: 459, 6: 899, 9: 0, 12: 1499 },
          salePrice: null,
          saleEndDate: null,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'YouTube Premium',
          description: 'Ad-free videos, background play, and YouTube Music Premium included.',
          category: 'OTT',
          image: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png',
          features: ['No Ads', 'Background Play', 'YouTube Music', 'Downloads'],
          pricing: { 1: 129, 3: 369, 6: 699, 9: 999, 12: 1299 },
          salePrice: null,
          saleEndDate: null,
          status: 'out_of_stock',
          createdAt: new Date().toISOString()
        }
      ];

      await db.collection('products').insertMany(demoProducts);
      return NextResponse.json({ message: 'Demo products seeded', count: demoProducts.length }, { headers: corsHeaders });
    }

    const body = await request.json();

    // User registration
    if (path === 'auth/register') {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email and password required' }, { status: 400, headers: corsHeaders });
      }

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400, headers: corsHeaders });
      }

      const hashedPassword = await hashPassword(password);
      const role = isAdmin(email) ? 'admin' : 'customer';
      const user = {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await db.collection('users').insertOne(user);
      const token = generateToken(user);
      const { password: _, ...safeUser } = user;

      return NextResponse.json({ user: safeUser, token }, { headers: corsHeaders });
    }

    // User login
    if (path === 'auth/login') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400, headers: corsHeaders });
      }

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
      }

      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
      }

      await db.collection('users').updateOne({ id: user.id }, { $set: { lastLogin: new Date().toISOString() } });
      const token = generateToken(user);
      const { password: _, ...safeUser } = user;

      return NextResponse.json({ user: safeUser, token }, { headers: corsHeaders });
    }

    // Forgot password - request OTP
    if (path === 'auth/forgot-password') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400, headers: corsHeaders });
      }

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404, headers: corsHeaders });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { resetOtp: otp, resetOtpExpiry: otpExpiry } }
      );

      // In production, send email here. For now, return OTP (DEMO ONLY)
      console.log(`Password reset OTP for ${email}: ${otp}`);
      
      return NextResponse.json({ 
        message: 'OTP sent to your email',
        demo_otp: otp // Remove in production!
      }, { headers: corsHeaders });
    }

    // Reset password with OTP
    if (path === 'auth/reset-password') {
      const { email, otp, newPassword } = body;
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ error: 'Email, OTP and new password required' }, { status: 400, headers: corsHeaders });
      }

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }

      if (user.resetOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400, headers: corsHeaders });
      }

      if (new Date(user.resetOtpExpiry) < new Date()) {
        return NextResponse.json({ error: 'OTP expired' }, { status: 400, headers: corsHeaders });
      }

      const hashedPassword = await hashPassword(newPassword);
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { password: hashedPassword }, $unset: { resetOtp: '', resetOtpExpiry: '' } }
      );

      return NextResponse.json({ message: 'Password reset successful' }, { headers: corsHeaders });
    }

    // Create order
    if (path === 'orders') {
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const { productId, productName, duration, amount, paymentMethod } = body;
      const order = {
        id: uuidv4(),
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        productId,
        productName,
        duration,
        amount,
        paymentMethod,
        status: paymentMethod === 'whatsapp' ? 'pending' : 'processing',
        createdAt: new Date().toISOString()
      };

      await db.collection('orders').insertOne(order);
      return NextResponse.json(order, { headers: corsHeaders });
    }

    // Admin: Create product
    if (path === 'admin/products') {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const { name, description, category, image, features, pricing, salePrice, saleEndDate, status } = body;
      const product = {
        id: uuidv4(),
        name,
        description,
        category,
        image,
        features: features || [],
        pricing: pricing || { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
        salePrice: salePrice || null,
        saleEndDate: saleEndDate || null,
        status: status || 'active',
        createdAt: new Date().toISOString()
      };

      await db.collection('products').insertOne(product);
      return NextResponse.json(product, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';
  const db = await getDb();

  try {
    const body = await request.json();

    // Admin: Update product
    if (path.startsWith('admin/products/')) {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const productId = path.split('/')[2];
      const { name, description, category, image, features, pricing, salePrice, saleEndDate, status } = body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (image !== undefined) updateData.image = image;
      if (features !== undefined) updateData.features = features;
      if (pricing !== undefined) updateData.pricing = pricing;
      if (salePrice !== undefined) updateData.salePrice = salePrice;
      if (saleEndDate !== undefined) updateData.saleEndDate = saleEndDate;
      if (status !== undefined) updateData.status = status;
      updateData.updatedAt = new Date().toISOString();

      const result = await db.collection('products').updateOne({ id: productId }, { $set: updateData });
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }

      const updated = await db.collection('products').findOne({ id: productId });
      return NextResponse.json(updated, { headers: corsHeaders });
    }

    // Admin: Update order status
    if (path.startsWith('admin/orders/')) {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const orderId = path.split('/')[2];
      const { status } = body;

      const result = await db.collection('orders').updateOne(
        { id: orderId },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
      }

      const updated = await db.collection('orders').findOne({ id: orderId });
      return NextResponse.json(updated, { headers: corsHeaders });
    }

    // Update user profile
    if (path === 'profile') {
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const { name } = body;
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: { name, updatedAt: new Date().toISOString() } }
      );

      const updated = await db.collection('users').findOne({ id: user.id });
      const { password, ...safeUser } = updated;
      return NextResponse.json(safeUser, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';
  const db = await getDb();

  try {
    // Admin: Delete product
    if (path.startsWith('admin/products/')) {
      const user = await requireAdmin(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      const productId = path.split('/')[2];
      const result = await db.collection('products').deleteOne({ id: productId });

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
      }

      return NextResponse.json({ message: 'Product deleted' }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
