import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Package, RefreshCw, XCircle } from 'lucide-react';
import API from '../services/api';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/subscriptions')
      .then(res => setSubscriptions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Subscriptions</h1>
        <p className="text-sm text-gray-500">Manage recurring milk and dairy orders</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No active subscriptions found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub, i) => (
            <motion.div key={sub._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative">
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                {sub.status}
              </span>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 overflow-hidden">
                  {sub.product?.image ? (
                    <img src={sub.product.image} className="w-full h-full object-cover" alt="product" />
                  ) : <Package size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{sub.product?.name || 'Unknown Product'}</h3>
                  <p className="text-xs text-gray-500 capitalize">{sub.planType} Plan</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 border-t border-gray-50 pt-3">
                <p><span className="font-medium">Customer:</span> {sub.user?.name} ({sub.user?.phone || 'No phone'})</p>
                {sub.planType === 'daily' ? (
                  <p><span className="font-medium">Quantity/Day:</span> {sub.dailyQuantity}</p>
                ) : (
                  <div className="flex gap-1 flex-wrap">
                    <span className="font-medium">Weekly Schedule:</span>
                    {sub.weeklyPlan?.map(day => (
                      <span key={day.dayOfWeek} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {day.dayOfWeek.slice(0, 3)}: {day.quantity}
                      </span>
                    ))}
                  </div>
                )}
                <p><span className="font-medium">Next Delivery:</span> {new Date(sub.nextDelivery).toLocaleDateString('en-IN')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
