import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

const statuses = ['all', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentStatusColors = {
  pending: 'bg-gray-100 text-gray-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('orders'); // 'orders' or 'payments'
  const [approveLoading, setApproveLoading] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => { fetchOrders(); }, [filter]);
  useEffect(() => { if (tab === 'payments') fetchPendingPayments(); }, [tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await API.get('/orders', { params });
      setOrders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await API.get('/payments/pending/all');
      setPendingPayments(res.data);
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success(`Order ${status.replace('_', ' ')}`);
      fetchOrders();
    } catch (err) { toast.error('Failed to update'); }
  };

  const approvePayment = async (paymentId, orderId) => {
    setApproveLoading({ ...approveLoading, [paymentId]: true });
    try {
      await API.post(`/payments/${paymentId}/approve`, {
        verificationNotes: 'Approved by admin'
      });
      toast.success('Payment approved! Order confirmed.');
      fetchPendingPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setApproveLoading({ ...approveLoading, [paymentId]: false }); }
  };

  const rejectPayment = async (paymentId) => {
    const reason = rejectReason[paymentId] || 'Payment mismatch';
    if (!reason) { toast.error('Please enter rejection reason'); return; }
    
    setApproveLoading({ ...approveLoading, [paymentId]: true });
    try {
      await API.post(`/payments/${paymentId}/reject`, {
        rejectionReason: reason
      });
      toast.success('Payment rejected. Customer notified.');
      setRejectReason({ ...rejectReason, [paymentId]: '' });
      fetchPendingPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setApproveLoading({ ...approveLoading, [paymentId]: false }); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <p className="text-sm text-gray-500">Manage orders and verify payments</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === 'orders' ? 'gradient-bg text-white' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          <Package className="inline mr-2" size={18} />
          All Orders ({orders.length})
        </button>
        <button 
          onClick={() => setTab('payments')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === 'payments' ? 'gradient-bg text-white' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          <DollarSign className="inline mr-2" size={18} />
          Pending Payments ({pendingPayments.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filter === s ? 'gradient-bg text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="bg-white h-20 rounded-xl animate-pulse border border-gray-100" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.user?.name} - {order.user?.phone}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-green-600">Rs.{order.totalAmount}</p>
                        <p className="text-xs text-gray-400">{order.items.length} items</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status]}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusColors[order.paymentStatus]}`}>
                            {order.paymentStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${order.paymentMethod === 'cod' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                            {order.paymentMethod === 'cod' ? 'COD (Cash on Delivery)' : 'Online (UPI/QR)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {order.items.map((item, j) => (
                        <span key={j} className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Status actions */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <button onClick={() => updateStatus(order._id, 'confirmed')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                            Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button onClick={() => updateStatus(order._id, 'processing')}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100">
                            Process
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button onClick={() => updateStatus(order._id, 'out_for_delivery')}
                            className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100">
                            Out for Delivery
                          </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <button onClick={() => updateStatus(order._id, 'delivered')}
                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100">
                            Mark Delivered
                          </button>
                        )}
                        <button onClick={() => updateStatus(order._id, 'cancelled')}
                          className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* PAYMENTS TAB */}
      {tab === 'payments' && (
        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <DollarSign size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No pending payments</p>
            </div>
          ) : (
            pendingPayments.map((payment) => (
              <motion.div 
                key={payment._id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border-2 border-yellow-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={20} className="text-yellow-600" />
                      <h3 className="font-bold text-gray-800">Order #{payment.order._id.slice(-6).toUpperCase()}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Customer: <span className="font-medium">{payment.user?.name}</span></p>
                    <p className="text-sm text-gray-600">Phone: <span className="font-medium">{payment.user?.phone}</span></p>
                    
                    {/* Proof Details Added */}
                    <div className="bg-white border text-sm border-gray-200 mt-3 p-3 rounded-xl shadow-sm">
                      <p className="text-gray-800 font-semibold">
                        UTR: <span className="font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded">{payment.utr || 'Not provided'}</span>
                      </p>
                      {payment.referenceNumber && <p className="text-xs text-gray-600 mt-1 mt-1">Ref: {payment.referenceNumber}</p>}
                      {payment.screenshot && (
                        <a href={payment.screenshot} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1">
                          View Payment Screenshot ↗
                        </a>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-gray-500 mt-2">Claimed paid at: {new Date(payment.userClaimedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">₹{payment.amount}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      Awaiting Verification
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                  <div className="space-y-1">
                    {payment.order.items?.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        • {item.name} x{item.quantity} = ₹{(item.price * item.quantity)}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => approvePayment(payment._id, payment.order._id)}
                    disabled={approveLoading[payment._id]}
                    className="flex-1 px-4 py-3 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg font-semibold hover:bg-green-100 transition disabled:opacity-50"
                  >
                    {approveLoading[payment._id] ? 'Approving...' : '✓ Approve Payment'}
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text"
                      placeholder="Rejection reason..."
                      value={rejectReason[payment._id] || ''}
                      onChange={(e) => setRejectReason({ ...rejectReason, [payment._id]: e.target.value })}
                      className="flex-1 px-3 py-3 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button 
                      onClick={() => rejectPayment(payment._id)}
                      disabled={approveLoading[payment._id]}
                      className="px-4 py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {approveLoading[payment._id] ? '...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
