import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Truck, CalendarCheck, BarChart3, Shield, Zap, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: ShoppingCart, title: 'Easy Ordering', desc: 'Browse and order fresh dairy products with Amazon-style shopping' },
  { icon: Truck, title: 'Daily Delivery', desc: 'Fresh milk delivered to your doorstep every morning' },
  { icon: CalendarCheck, title: 'Subscriptions', desc: 'Set up daily, weekly or custom milk delivery plans' },
  { icon: BarChart3, title: 'AI Analytics', desc: 'Smart demand prediction and inventory optimization' },
  { icon: Shield, title: 'Quality Check', desc: 'AI-powered spoilage detection for quality assurance' },
  { icon: Zap, title: 'Real-time Updates', desc: 'Live notifications for orders and delivery status' },
];

const categories = [
  { name: 'Cow Milk', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },
  { name: 'Buffalo Milk', img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop' },
  { name: 'Paneer', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&h=200&fit=crop' },
  { name: 'Curd', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
  { name: 'Butter', img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&h=200&fit=crop' },
  { name: 'Ghee', img: 'https://images.unsplash.com/photo-1600398142498-f5610992b066?w=200&h=200&fit=crop' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <span className="text-sm text-green-200">Trusted by 500+ families in Sangli</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
              Fresh Dairy<br />
              <span className="text-green-300">Delivered Daily</span>
            </h1>
            <p className="text-lg text-green-100 mb-8 max-w-lg">
              Premium quality milk, paneer, curd, butter, ghee and more from Vasant Dairy Agency. Farm fresh to your doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 transition shadow-lg">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/subscriptions"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-green-400 text-white rounded-xl font-semibold hover:bg-green-600 transition">
                Start Subscription
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <Link to={`/shop?category=${cat.name.toLowerCase().split(' ')[0]}`}
                className="bg-white rounded-2xl p-3 text-center shadow-lg hover:shadow-xl transition-all block border border-gray-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-2 bg-green-50">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://placehold.co/200/e8f5e9/2e7d32?text=${cat.name.charAt(0)}`; }} />
                </div>
                <p className="text-xs font-semibold text-gray-700">{cat.name}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Why Choose DairyOS Pro?</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Smart dairy management powered by AI technology</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <f.icon size={22} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Your Daily Milk Subscription</h2>
          <p className="text-green-100 mb-6 max-w-lg mx-auto">Never run out of fresh milk again. Set up your custom delivery plan today.</p>
          <Link to="/subscriptions"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 transition shadow-lg">
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">DairyOS Pro</h3>
              <p className="text-sm">Vasant Dairy Agency, Sangli</p>
              <p className="text-sm">Owner: Kedar Patil</p>
              <p className="text-sm">Phone: 8766997752 / 9975882125</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/shop" className="block hover:text-white transition">Shop</Link>
                <Link to="/subscriptions" className="block hover:text-white transition">Subscriptions</Link>
                <Link to="/orders" className="block hover:text-white transition">Orders</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Products</h4>
              <div className="space-y-2 text-sm">
                <p>Cow Milk | Buffalo Milk</p>
                <p>Paneer | Curd | Butter</p>
                <p>Ghee | Buttermilk | Cheese</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>&copy; 2024 DairyOS Pro - Vasant Dairy Agency. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
