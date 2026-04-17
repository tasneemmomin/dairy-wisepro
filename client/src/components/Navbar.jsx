import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, LogOut, Bell, Menu, X, Home, Store, Package, CalendarCheck, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount, markAllRead } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/shop', label: 'Shop', icon: Store },
    { to: '/subscriptions', label: 'Subscriptions', icon: CalendarCheck },
    { to: '/orders', label: 'Orders', icon: Package },
  ];

  if (isAdmin) navLinks.push({ to: '/admin', label: 'Dashboard', icon: LayoutDashboard });

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-card shadow-sm border-b border-green-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>Vasant Dairy Agency | Owner: Kedar Patil</span>
          <span>Phone: 8766997752 / 9975882125 | Sangli</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">DairyOS Pro</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Smart Dairy Management</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to) ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => { navigate('/notifications'); markAllRead(); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <ShoppingCart size={20} className="text-gray-600" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
                <User size={16} /> Login
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-gray-100 bg-white p-4 space-y-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.to) ? 'bg-green-100 text-green-700' : 'text-gray-600'
              }`}>
              <link.icon size={16} /> {link.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 w-full">
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-600">
              <User size={16} /> Login
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
}
