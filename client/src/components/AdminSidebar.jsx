import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users, CalendarCheck,
  Warehouse, Truck, BarChart3, Brain, Bell, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CalendarCheck },
  { to: '/admin/delivery', label: 'Daily Delivery', icon: Truck },
  { to: '/admin/billing', label: 'Monthly Bills', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/admin/vendors', label: 'Vendors', icon: Warehouse },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/ai-insights', label: 'AI Insights', icon: Brain },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      className="h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col shadow-sm z-40"
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold gradient-text">DairyOS Pro</h1>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map(link => (
          <Link key={link.to} to={link.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(link.to)
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <link.icon size={18} className="flex-shrink-0" />
            {!collapsed && link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link to="/shop"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">
          <Package size={18} /> {!collapsed && 'Back to Shop'}
        </Link>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full transition">
          <LogOut size={18} /> {!collapsed && 'Logout'}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-50 w-full transition">
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
        </button>
      </div>
    </motion.aside>
  );
}
