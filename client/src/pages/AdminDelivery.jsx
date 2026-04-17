import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, CheckCircle, XCircle, Clock, MapPin, Phone } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function AdminDelivery() {
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ deliveredCount: 0, missedCount: 0, totalToday: 0 });

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        API.get('/delivery/daily'),
        API.get('/delivery/stats')
      ]);
      setDeliveryList(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Delivery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (customerId, status) => {
    try {
      await API.post('/delivery/log', {
        customerId,
        status,
        products: [{ quantity: 1, unit: 'L' }] // Defaulting to 1L for demo
      });
      toast.success(`Marked as ${status}`);
      fetchDeliveryData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Delivery</h1>
          <p className="text-sm text-gray-500">Track and manage today's milk distribution</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-green-100">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">{stats.deliveredCount} Delivered</span>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-red-100">
            <Clock size={16} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700">{stats.missedCount} Missed</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Truck size={18} /> Active Delivery List
            </h3>
            <span className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-100 text-gray-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-10 text-center text-gray-400 animate-pulse">Loading list...</div>
            ) : deliveryList.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No deliveries scheduled for today</div>
            ) : deliveryList.map((customer) => (
              <motion.div 
                key={customer._id} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-800">{customer.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {customer.route}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
                    </div>
                    <p className="text-xs mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg inline-block font-semibold">
                      Required: {customer.milkQuantity}L ({customer.preferredDeliveryTime})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateDeliveryStatus(customer._id, 'Delivered')}
                      className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition"
                      title="Mark Delivered"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => updateDeliveryStatus(customer._id, 'Missed')}
                      className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition"
                      title="Mark Missed"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 h-fit">
          <h3 className="font-semibold text-gray-800">Route Map / Status</h3>
          <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
             <MapPin size={48} className="mb-2 opacity-20" />
             <p className="text-sm">Interactive Route Map</p>
             <p className="text-[10px]">Real-time GPS tracking coming soon</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Quick Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-800">{deliveryList.length}</p>
                <p className="text-[10px] text-gray-500">Total Customers</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-800">{deliveryList.reduce((acc, c) => acc + (c.milkQuantity || 0), 0)}L</p>
                <p className="text-[10px] text-gray-500">Total Volume</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
