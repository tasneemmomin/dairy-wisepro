import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');

  // Login state
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd]   = useState(false);
  const [loginLoading, setLoginLoading]   = useState(false);

  // Register state
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPassword, setRegPassword]   = useState('');
  const [showRegPwd, setShowRegPwd]     = useState(false);
  const [regLoading, setRegLoading]     = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // ── Login handler ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Please enter email and password');
      return;
    }
    setLoginLoading(true);
    try {
      const user = await login(loginEmail.trim(), loginPassword);
      toast.success('Welcome back! 👋');
      if (['OWNER', 'ADMIN', 'STAFF', 'DELIVERY'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register handler ───────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!regEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setRegLoading(true);
    try {
      await register({ name: regName.trim(), email: regEmail.trim(), password: regPassword });
      toast.success('Account created! Welcome 🎉');
      navigate('/shop');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  // ── Reset helpers ──────────────────────────────────────────────────────
  const resetAll = () => {
    setLoginEmail(''); setLoginPassword(''); setShowLoginPwd(false);
    setRegName(''); setRegEmail(''); setRegPassword(''); setShowRegPwd(false);
  };

  // ── Shared input class ─────────────────────────────────────────────────
  const inputCls = 'w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">DairyOS Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Vasant Dairy Agency, Sangli</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setActiveTab('login'); resetAll(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'login' ? 'bg-white text-green-600 shadow' : 'text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); resetAll(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'register' ? 'bg-white text-green-600 shadow' : 'text-gray-500'
            }`}
          >
            Create Account
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── LOGIN TAB ─────────────────────────────────────────────── */}
          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <form onSubmit={handleLogin} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={inputCls}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loginLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── REGISTER TAB ──────────────────────────────────────────── */}
          {activeTab === 'register' && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter your full name"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={inputCls}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd(!showRegPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">🔒 Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {regLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  {regLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          🔐 Secure login. Your data is safe with us.
        </p>
      </motion.div>
    </div>
  );
}
