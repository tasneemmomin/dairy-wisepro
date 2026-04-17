import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Edit3, Trash2, X, Save, Phone, MapPin, Star } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', products: '',
    address: { street: '', city: 'Sangli', state: 'Maharashtra', pincode: '' },
    rating: 0
  });

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await API.get('/vendors');
      setVendors(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', products: '', address: { street: '', city: 'Sangli', state: 'Maharashtra', pincode: '' }, rating: 0 });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (v) => {
    setForm({ name: v.name, phone: v.phone, email: v.email || '', products: (v.products || []).join(', '), address: v.address || {}, rating: v.rating || 0 });
    setEditId(v._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, products: form.products.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (editId) {
        await API.put(`/vendors/${editId}`, data);
        toast.success('Vendor updated');
      } else {
        await API.post('/vendors', data);
        toast.success('Vendor added');
      }
      resetForm();
      fetchVendors();
    } catch (err) { toast.error('Failed to save vendor'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try { await API.delete(`/vendors/${id}`); toast.success('Vendor deleted'); fetchVendors(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-500">{vendors.length} vendors</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editId ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
                  <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Products (comma separated)</label>
                <input type="text" value={form.products} onChange={e => setForm({ ...form, products: e.target.value })}
                  placeholder="Cow Milk, Buffalo Milk, Curd"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
                <input type="text" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                  placeholder="Street, City"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                  <Save size={14} /> {editId ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Vendors grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-gray-100 h-40" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20">
          <Truck size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No vendors added</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor, i) => (
            <motion.div key={vendor._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {vendor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{vendor.name}</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={10} className={j < (vendor.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(vendor)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500"><Edit3 size={13} /></button>
                  <button onClick={() => handleDelete(vendor._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2"><Phone size={11} /> {vendor.phone}</div>
                {vendor.address?.street && <div className="flex items-center gap-2"><MapPin size={11} /> {vendor.address.street}</div>}
              </div>
              {vendor.products?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {vendor.products.map(p => (
                    <span key={p} className="px-2 py-0.5 bg-gray-50 rounded-lg text-[11px] text-gray-600">{p}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
