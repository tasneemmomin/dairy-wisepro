import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Pause, Play, Trash2, Plus } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const [form, setForm] = useState({
    product: '',
    planType: 'daily',
    dailyQuantity: 1,
    weeklyPlan: days.map(d => ({ day: d, quantity: 1, enabled: true }))
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, prodRes] = await Promise.all([
        API.get('/subscriptions/my'),
        API.get('/products?category=milk')
      ]);
      setSubs(subsRes.data);
      setProducts(prodRes.data);
      if (prodRes.data.length > 0) setForm(f => ({ ...f, product: prodRes.data[0]._id }));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login first'); return; }
    try {
      const selectedProduct = products.find(p => p._id === form.product);
      await API.post('/subscriptions', {
        ...form,
        pricePerUnit: selectedProduct?.price || 60
      });
      toast.success('Subscription created!');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handlePause = async (id) => {
    await API.put(`/subscriptions/${id}/pause`);
    toast.success('Subscription paused');
    fetchData();
  };

  const handleResume = async (id) => {
    await API.put(`/subscriptions/${id}/resume`);
    toast.success('Subscription resumed');
    fetchData();
  };

  const handleCancel = async (id) => {
    await API.put(`/subscriptions/${id}/cancel`);
    toast.success('Subscription cancelled');
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subscriptions</h1>
          <p className="text-sm text-gray-500">Manage your daily milk delivery plans</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Create Subscription</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Product</label>
              <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} - Rs.{p.price}/{p.unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Plan Type</label>
              <select value={form.planType} onChange={e => setForm({ ...form, planType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="daily">Daily (Same every day)</option>
                <option value="custom">Custom (Per day)</option>
              </select>
            </div>
          </div>

          {form.planType === 'daily' ? (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Daily Quantity (liters)</label>
              <input type="number" min="0.5" step="0.5" value={form.dailyQuantity}
                onChange={e => setForm({ ...form, dailyQuantity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
          ) : (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-2 block">Weekly Plan</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {form.weeklyPlan.map((day, i) => (
                  <div key={day.day} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700 capitalize">{day.day.slice(0, 3)}</span>
                      <input type="checkbox" checked={day.enabled}
                        onChange={e => {
                          const plan = [...form.weeklyPlan];
                          plan[i].enabled = e.target.checked;
                          setForm({ ...form, weeklyPlan: plan });
                        }}
                        className="rounded text-green-500 focus:ring-green-500" />
                    </div>
                    <input type="number" min="0" step="0.5" value={day.quantity} disabled={!day.enabled}
                      onChange={e => {
                        const plan = [...form.weeklyPlan];
                        plan[i].quantity = Number(e.target.value);
                        setForm({ ...form, weeklyPlan: plan });
                      }}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center disabled:opacity-40" />
                    <p className="text-[10px] text-gray-400 text-center mt-1">liters</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
              Create Subscription
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Subscriptions list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-20">
          <CalendarCheck size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-500">No subscriptions</h2>
          <p className="text-sm text-gray-400">Create a subscription for daily milk delivery</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((sub, i) => (
            <motion.div key={sub._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CalendarCheck size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{sub.product?.name || 'Milk'}</h3>
                    <p className="text-xs text-gray-500 capitalize">{sub.planType} plan - Rs.{sub.pricePerUnit}/{sub.product?.unit || 'liter'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sub.status === 'active' ? 'bg-green-100 text-green-700' :
                  sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {sub.status}
                </span>
              </div>

              {sub.planType === 'daily' && (
                <p className="text-sm text-gray-600 mb-3">Delivery: {sub.dailyQuantity}L every day</p>
              )}
              {sub.planType === 'custom' && sub.weeklyPlan && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {sub.weeklyPlan.filter(d => d.enabled).map(d => (
                    <span key={d.day} className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium capitalize">
                      {d.day.slice(0, 3)}: {d.quantity}L
                    </span>
                  ))}
                </div>
              )}

              {sub.status !== 'cancelled' && (
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  {sub.status === 'active' ? (
                    <button onClick={() => handlePause(sub._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-yellow-200 text-yellow-600 rounded-lg text-xs font-medium hover:bg-yellow-50">
                      <Pause size={12} /> Pause
                    </button>
                  ) : sub.status === 'paused' ? (
                    <button onClick={() => handleResume(sub._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 rounded-lg text-xs font-medium hover:bg-green-50">
                      <Play size={12} /> Resume
                    </button>
                  ) : null}
                  <button onClick={() => handleCancel(sub._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50">
                    <Trash2 size={12} /> Cancel
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
