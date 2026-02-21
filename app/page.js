'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Search, ShoppingCart, User, LogOut, Shield, Zap, Clock, CheckCircle2,
  Star, ChevronRight, MessageCircle, CreditCard, Package, Settings,
  Users, BarChart3, Plus, Edit, Trash2, Eye, EyeOff, Menu, X, Timer,
  ArrowRight, Sparkles, TrendingUp, Home, Mail, Lock, Phone
} from 'lucide-react';

const WHATSAPP_NUMBER = '919522349098';

// Auth Context
function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return { user, token, loading, login, logout, isAdmin: user?.role === 'admin' };
}

// API helper
const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`/api/${endpoint}`, { ...options, headers });
    
    // Check if response has content
    const text = await res.text();
    if (!text) {
      if (!res.ok) throw new Error('Request failed');
      return {};
    }
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', text);
      throw new Error('Invalid server response');
    }
    
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// Countdown Timer Component
function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
      <Timer className="w-3 h-3" />
      <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
    </div>
  );
}

// Header Component
function Header({ currentPage, setCurrentPage, auth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 font-bold text-xl text-purple-700 hover:text-purple-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline">DiscountOnTools</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('products')}
              className={`text-sm font-medium transition-colors ${currentPage === 'products' ? 'text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
            >
              Products
            </button>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {auth.user ? (
              <>
                {auth.isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage('admin')}
                    className="hidden sm:flex border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage('dashboard')}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">{auth.user.name}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={auth.logout}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setCurrentPage('auth')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-100">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }}
                className="px-4 py-2 text-left text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => { setCurrentPage('products'); setMobileMenuOpen(false); }}
                className="px-4 py-2 text-left text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
              >
                Products
              </button>
              {auth.isAdmin && (
                <button
                  onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                >
                  Admin Panel
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Trust Bar Component
function TrustBar() {
  const stats = [
    { icon: Package, label: '5000+ Tools Sold', color: 'text-purple-600' },
    { icon: Shield, label: '100% Satisfaction', color: 'text-green-600' },
    { icon: Zap, label: 'Instant Delivery', color: 'text-yellow-600' },
  ];

  return (
    <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 border-y border-purple-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm font-medium text-gray-700">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero Section
function HeroSection({ setCurrentPage }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-white to-purple-50" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Premium Digital Subscriptions at Best Prices
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Get Your Favorite
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent"> Digital Tools </span>
            at Unbeatable Prices
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Netflix, Spotify, ChatGPT, Canva & more – Premium subscriptions delivered instantly to your inbox.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setCurrentPage('products')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 text-lg"
            >
              Browse Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg"
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I want to know more about your products`, '_blank')}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product, onClick }) {
  const getLowestPrice = () => {
    const prices = Object.values(product.pricing || {}).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const getLowestSalePrice = () => {
    if (!product.salePrice) return null;
    const prices = Object.values(product.salePrice).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const hasSale = product.saleEndDate && new Date(product.saleEndDate) > new Date() && product.salePrice;
  const lowestPrice = getLowestPrice();
  const lowestSalePrice = getLowestSalePrice();
  const isOutOfStock = product.status === 'out_of_stock';

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-purple-100 overflow-hidden ${isOutOfStock ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-0">
        <div className="relative">
          {/* Product Image */}
          <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-white rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Package className="w-12 h-12 text-purple-300" />
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {hasSale && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs animate-pulse-glow">
                SALE
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <Badge variant="outline" className="mt-1 text-xs border-purple-200 text-purple-600">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Sale Timer */}
        {hasSale && <div className="mt-2"><CountdownTimer endDate={product.saleEndDate} /></div>}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Starting from</p>
          <div className="flex items-baseline gap-2">
            {hasSale && lowestSalePrice ? (
              <>
                <span className="text-xl font-bold text-purple-700">₹{lowestSalePrice}</span>
                <span className="text-sm text-gray-400 line-through">₹{lowestPrice}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-purple-700">₹{lowestPrice}</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
      </CardFooter>
    </Card>
  );
}

// Skeleton Card for loading
function ProductCardSkeleton() {
  return (
    <Card className="border-purple-100 overflow-hidden animate-pulse">
      <CardHeader className="p-4 pb-0">
        <div className="w-full h-32 bg-gray-200 rounded-xl mb-3" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </CardFooter>
    </Card>
  );
}

// Product Grid
function ProductGrid({ products, setSelectedProduct, setCurrentPage, loading }) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Popular Products</h2>
          <p className="text-gray-600 mt-1">Top-selling digital subscriptions</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentPage('products')}
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products available</p>
          </div>
        ) : (
          products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => {
                setSelectedProduct(product);
                setCurrentPage('product');
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}

// Products Page with Filters
function ProductsPage({ products, setSelectedProduct, setCurrentPage, searchTerm, setSearchTerm, filters, setFilters, loading }) {
  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.status === 'instock' && p.status !== 'active') return false;
    if (filters.status === 'outofstock' && p.status !== 'out_of_stock') return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-600">Find the perfect subscription for your needs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:ring-purple-500"
          />
        </div>
        <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
          <SelectTrigger className="w-full md:w-40 border-purple-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="OTT">OTT</SelectItem>
            <SelectItem value="Software">Software</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-full md:w-40 border-purple-200">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="instock">In Stock</SelectItem>
            <SelectItem value="outofstock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">No products found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => {
                setSelectedProduct(product);
                setCurrentPage('product');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Product Details Page
function ProductDetailsPage({ product, auth, setCurrentPage }) {
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Button onClick={() => setCurrentPage('products')} className="mt-4">Back to Products</Button>
      </div>
    );
  }

  const hasSale = product.saleEndDate && new Date(product.saleEndDate) > new Date() && product.salePrice;
  const isOutOfStock = product.status === 'out_of_stock';

  // Get available durations (price > 0)
  const availableDurations = Object.entries(product.pricing || {})
    .filter(([_, price]) => price > 0)
    .map(([dur, price]) => ({
      duration: parseInt(dur),
      price,
      salePrice: hasSale && product.salePrice?.[dur] > 0 ? product.salePrice[dur] : null
    }));

  // Set default selection
  useEffect(() => {
    if (availableDurations.length > 0 && !selectedDuration) {
      setSelectedDuration(availableDurations[0].duration);
    }
  }, [availableDurations]);

  const selectedPlan = availableDurations.find(d => d.duration === selectedDuration);
  const currentPrice = selectedPlan?.salePrice || selectedPlan?.price || 0;
  const originalPrice = selectedPlan?.price || 0;
  const savings = selectedPlan?.salePrice ? originalPrice - selectedPlan.salePrice : 0;

  const handleBuyNow = async () => {
    if (!auth.user) {
      toast.error('Please login to place an order');
      setCurrentPage('auth');
      return;
    }

    setLoading(true);
    try {
      await api('orders', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          duration: selectedDuration,
          amount: currentPrice,
          paymentMethod: 'online'
        })
      });
      toast.success('Order placed! Payment integration coming soon.');
      setCurrentPage('dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const message = `Hi, I want to order:\n\n*Product:* ${product.name}\n*Duration:* ${selectedDuration} month(s)\n*Price:* ₹${currentPrice}\n\nPlease confirm availability.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => setCurrentPage('products')}
        className="mb-6 text-gray-600 hover:text-purple-700"
      >
        ← Back to Products
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-w-[200px] max-h-[200px] object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <Package className="w-24 h-24 text-purple-300" />
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Badge variant="outline" className="mb-2 border-purple-200 text-purple-600">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>
            {isOutOfStock && (
              <Badge variant="secondary" className="bg-red-100 text-red-600">
                Out of Stock
              </Badge>
            )}
          </div>

          {hasSale && (
            <div className="mb-4">
              <CountdownTimer endDate={product.saleEndDate} />
            </div>
          )}

          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Duration Selection */}
          <div className="mb-6">
            <Label className="text-gray-900 font-semibold mb-3 block">Select Duration</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {availableDurations.map(({ duration, price, salePrice }) => (
                <button
                  key={duration}
                  onClick={() => setSelectedDuration(duration)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedDuration === duration
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{duration} {duration === 1 ? 'Month' : 'Months'}</div>
                  <div className="text-xs text-purple-600 font-medium">₹{salePrice || price}</div>
                  {salePrice && (
                    <div className="text-xs text-gray-400 line-through">₹{price}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-purple-700">₹{currentPrice}</span>
              {savings > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{originalPrice}</span>
                  <Badge className="bg-green-100 text-green-700">Save ₹{savings}</Badge>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">for {selectedDuration} {selectedDuration === 1 ? 'month' : 'months'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={handleBuyNow}
              disabled={isOutOfStock || loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {loading ? 'Processing...' : 'Buy Now'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleWhatsAppOrder}
              disabled={isOutOfStock}
              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Order via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auth Page
function AuthPage({ auth, setCurrentPage }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '', newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await api('auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        auth.login(data.user, data.token);
        toast.success('Welcome back!');
        setCurrentPage('home');
      } else if (mode === 'register') {
        const data = await api('auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
        });
        auth.login(data.user, data.token);
        toast.success('Account created successfully!');
        setCurrentPage('home');
      } else if (mode === 'forgot') {
        const data = await api('auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: formData.email })
        });
        toast.success('OTP sent to your email');
        // For demo, show OTP
        if (data.demo_otp) {
          toast.info(`Demo OTP: ${data.demo_otp}`, { duration: 10000 });
        }
        setMode('reset');
      } else if (mode === 'reset') {
        await api('auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email: formData.email, otp: formData.otp, newPassword: formData.newPassword })
        });
        toast.success('Password reset successful!');
        setMode('login');
        setFormData({ name: '', email: '', password: '', otp: '', newPassword: '' });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-purple-100">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Forgot Password'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-gray-600 text-sm">
            {mode === 'login' && 'Sign in to continue shopping'}
            {mode === 'register' && 'Join us to get exclusive deals'}
            {mode === 'forgot' && 'Enter your email to receive OTP'}
            {mode === 'reset' && 'Enter OTP and new password'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label>Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 border-purple-200"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-purple-200"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <Label>Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 border-purple-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <Label>OTP Code</Label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    className="border-purple-200"
                    required
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="pl-10 border-purple-200"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {loading ? 'Please wait...' : (
                mode === 'login' ? 'Sign In' :
                mode === 'register' ? 'Create Account' :
                mode === 'forgot' ? 'Send OTP' : 'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('forgot')}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
              <p className="text-sm text-gray-600">
                <button
                  onClick={() => setMode('login')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Back to Sign In
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Customer Dashboard
function DashboardPage({ auth, setCurrentPage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api('orders');
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!auth.user) {
    setCurrentPage('auth');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600 mb-8">Manage your orders and account details</p>

        {/* User Info Card */}
        <Card className="border-purple-100 mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {auth.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{auth.user.name}</h2>
                <p className="text-gray-600">{auth.user.email}</p>
                <Badge variant="outline" className="mt-1 border-purple-200 text-purple-600">
                  {auth.user.role === 'admin' ? 'Admin' : 'Customer'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Orders */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-purple-100">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No orders yet</h3>
              <p className="text-gray-500 mt-2">Start shopping to see your orders here</p>
              <Button
                onClick={() => setCurrentPage('products')}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-purple-100">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {order.duration} month(s) • ₹{order.amount}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ordered on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-200">
                        {order.paymentMethod === 'whatsapp' ? 'WhatsApp' : 'Online'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Panel
function AdminPanel({ auth, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    if (!auth.isAdmin) {
      toast.error('Admin access required');
      setCurrentPage('home');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, usersData, statsData] = await Promise.all([
        api('products'),
        api('admin/orders'),
        api('admin/users'),
        api('admin/stats')
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api(`admin/products/${productId}`, { method: 'DELETE' });
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api(`admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success('Order status updated');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!auth.isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage your store</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <Button
              onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          <Badge className={product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {product.status === 'active' ? 'Active' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="border-purple-100">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {order.userName} ({order.userEmail})
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.duration} months • ₹{order.amount} • {order.paymentMethod}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(status) => handleUpdateOrderStatus(order.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">No orders yet</div>
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>
                        {user.role}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={showProductForm}
        onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
        product={editingProduct}
        onSave={loadData}
      />
    </div>
  );
}

// Product Form Dialog
function ProductFormDialog({ open, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTT',
    image: '',
    features: '',
    pricing: { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
    salePrice: { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
    saleEndDate: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'OTT',
        image: product.image || '',
        features: (product.features || []).join(', '),
        pricing: product.pricing || { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
        salePrice: product.salePrice || { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
        saleEndDate: product.saleEndDate ? product.saleEndDate.split('T')[0] : '',
        status: product.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'OTT',
        image: '',
        features: '',
        pricing: { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
        salePrice: { 1: 0, 3: 0, 6: 0, 9: 0, 12: 0 },
        saleEndDate: '',
        status: 'active'
      });
    }
  }, [product, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        saleEndDate: formData.saleEndDate ? new Date(formData.saleEndDate).toISOString() : null,
        salePrice: Object.values(formData.salePrice).some(v => v > 0) ? formData.salePrice : null
      };

      if (product) {
        await api(`admin/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Product updated');
      } else {
        await api('admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Product created');
      }

      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTT">OTT</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Image URL</Label>
            <Input
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Features (comma separated)</Label>
            <Input
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Feature 1, Feature 2, Feature 3"
            />
          </div>

          <div>
            <Label>Pricing (₹) - Set 0 to hide duration</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[1, 3, 6, 9, 12].map((dur) => (
                <div key={dur}>
                  <Label className="text-xs">{dur}M</Label>
                  <Input
                    type="number"
                    value={formData.pricing[dur] || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, [dur]: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Sale Pricing (₹) - Leave 0 for no sale</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[1, 3, 6, 9, 12].map((dur) => (
                <div key={dur}>
                  <Label className="text-xs">{dur}M</Label>
                  <Input
                    type="number"
                    value={formData.salePrice?.[dur] || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      salePrice: { ...formData.salePrice, [dur]: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sale End Date</Label>
              <Input
                type="date"
                value={formData.saleEndDate}
                onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">DiscountOnTools</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your one-stop shop for premium digital subscriptions at unbeatable prices.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-purple-400">Home</a></li>
              <li><a href="#" className="hover:text-purple-400">Products</a></li>
              <li><a href="#" className="hover:text-purple-400">About Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-purple-400">OTT Platforms</a></li>
              <li><a href="#" className="hover:text-purple-400">Software Tools</a></li>
              <li><a href="#" className="hover:text-purple-400">AI Tools</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@discountontools.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +91 95223 49098
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} DiscountOnTools. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Main App
export default function App() {
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Seed in background (don't wait)
      fetch('/api/seed', { method: 'POST' }).catch(() => {});
      // Load products
      const data = await api('products');
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} auth={auth} />
      
      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            <HeroSection setCurrentPage={setCurrentPage} />
            <TrustBar />
            <ProductGrid
              products={products}
              setSelectedProduct={setSelectedProduct}
              setCurrentPage={setCurrentPage}
              loading={productsLoading}
            />
          </>
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            setSelectedProduct={setSelectedProduct}
            setCurrentPage={setCurrentPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
            loading={productsLoading}
          />
        )}

        {currentPage === 'product' && (
          <ProductDetailsPage
            product={selectedProduct}
            auth={auth}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage auth={auth} setCurrentPage={setCurrentPage} />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage auth={auth} setCurrentPage={setCurrentPage} />
        )}

        {currentPage === 'admin' && (
          <AdminPanel auth={auth} setCurrentPage={setCurrentPage} />
        )}
      </main>

      <Footer />
    </div>
  );
}
