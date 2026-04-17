import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle, CreditCard, Download } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import PayNowModal from '../components/PayNowModal';
import { downloadInvoicePDF } from '../services/invoiceService';

const statusColors = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  processing:       'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
};

const statusIcons = {
  pending: Clock, confirmed: Package, processing: Package,
  out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle,
};

export default function OrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [payOrder, setPayOrder] = useState(null); // order currently in Pay modal
  const { user } = useAuth();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders/my');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Called after PayNowModal confirms payment — refresh that order
  const handlePaymentSuccess = async (orderId) => {
    const res = await API.get('/orders/my').catch(() => null);
    if (res) setOrders(res.data);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-500">No orders yet</h2>
          <p className="text-sm text-gray-400">Your orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const StatusIcon = statusIcons[order.status] || Clock;
            const isPaid = order.paymentStatus === 'paid';

            return (
              <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">

                {/* Order header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon size={18} className="text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Payment status badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isPaid ? '✓ PAID' : '○ UNPAID'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Order items */}
                <div className="border-t border-gray-50 pt-3">
                  <div className="space-y-2">
                    {order.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 overflow-hidden">
                            <img src={item.image || `https://placehold.co/100/e8f5e9/2e7d32?text=${item.name?.charAt(0)}`}
                              alt={item.name} className="w-full h-full object-cover"
                              onError={e => { e.target.src = `https://placehold.co/100/e8f5e9/2e7d32?text=${item.name?.charAt(0)}`; }} />
                          </div>
                          <span className="text-gray-700">{item.name} x {item.quantity}</span>
                        </div>
                        <span className="font-medium text-gray-800">Rs.{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}
                    </span>
                    <span className="font-bold text-green-600">Total: Rs.{order.totalAmount.toFixed(0)}</span>
                  </div>

                  {/* Action buttons */}
                  {order.status !== 'cancelled' && (
                    <div className="flex gap-2 mt-3">
                      {/* Pay Now — only if unpaid and not cancelled */}
                      {!isPaid && (
                        <button
                          onClick={() => setPayOrder(order)}
                          className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm shadow-green-200">
                          <CreditCard size={15} />
                          Pay Now
                        </button>
                      )}

                      {/* Download Invoice — only if paid */}
                      {isPaid && (
                        <button
                          onClick={() => downloadInvoicePDF(order, user)}
                          className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm">
                          <Download size={15} />
                          Download Invoice PDF
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pay Now Modal */}
      <PayNowModal
        isOpen={!!payOrder}
        order={payOrder}
        user={user}
        onClose={() => setPayOrder(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
