import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import PaymentModal from '../components/PaymentModal';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handleCheckout = () => {
    if (!user) { 
      toast.error('Please login first'); 
      navigate('/login'); 
      return; 
    }
    if (items.length === 0) { 
      toast.error('Cart is empty'); 
      return; 
    }
    
    if (paymentMethod === 'cod') {
      confirmOrder('cod');
    } else {
      setShowPayment(true);
    }
  };

  const confirmOrder = async (method = 'qr_code') => {
    setShowPayment(false);
    setPlacing(true);
    try {
      const orderItems = items.map(item => ({ product: item._id, quantity: item.quantity }));
      
      // Create order with selected payment method
      const orderResponse = await API.post('/orders', {
        items: orderItems,
        deliveryAddress: user.address,
        paymentMethod: method,
        notes: method === 'cod' ? 'Cash on Delivery' : 'Paid via UPI QR Code'
      });

      if (method === 'qr_code') {
        const orderId = orderResponse.data._id;
        setOrderData(orderResponse.data);

        // Generate QR code for payment (which triggers WhatsApp notifications and generates link)
        const paymentResponse = await API.post('/payments/generate-qr', {
          orderId: orderId,
          amount: totalAmount
        });
        
        const whatsappUrl = paymentResponse.data.payment?.whatsappLink;
        if (whatsappUrl) {
          toast.success('Order placed! Redirecting to WhatsApp for payment...');
          window.open(whatsappUrl, '_blank');
        } else {
          toast.success('Order placed successfully!');
        }
      } else {
        toast.success('Order placed successfully! Pay on delivery.');
      }

      clearCart();
      // Navigate to OrdersPage
      navigate('/orders');
    } catch (err) {
      console.error('Order error:', err);
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ShoppingBag size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Add some fresh dairy products to get started</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-medium hover:opacity-90 transition">
            <ArrowLeft size={16} /> Browse Shop
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shopping Cart ({items.length})</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium">Clear All</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <motion.div key={item._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-green-50 overflow-hidden flex-shrink-0">
                <img src={item.image || `https://placehold.co/200/e8f5e9/2e7d32?text=${item.name?.charAt(0)}`}
                  alt={item.name} className="w-full h-full object-cover"
                  onError={e => { e.target.src = `https://placehold.co/200/e8f5e9/2e7d32?text=${item.name?.charAt(0)}`; }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-500">Rs.{item.price} / {item.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Plus size={14} />
                </button>
              </div>
              <p className="font-bold text-green-600 w-24 text-right">Rs.{(item.price * item.quantity).toFixed(0)}</p>
              <button onClick={() => removeFromCart(item._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="text-gray-800">Rs.{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="font-bold text-xl text-green-600">Rs.{totalAmount.toFixed(0)}</span>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <h4 className="font-medium text-gray-700 text-sm">Payment Method</h4>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-800">Cash on Delivery (COD)</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${paymentMethod === 'qr_code' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'qr_code'} onChange={() => setPaymentMethod('qr_code')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-800">Online Payment (UPI/QR)</span>
              </label>
            </div>

            <button onClick={handleCheckout} disabled={placing}
              className="w-full py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-green-200 disabled:opacity-50">
              {placing ? 'Placing Order...' : 'Proceed to Checkout'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">🚚 Fresh Dairy Delivery</p>
          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        totalAmount={totalAmount}
        onConfirm={() => confirmOrder('qr_code')}
      />
    </div>
  );
}
