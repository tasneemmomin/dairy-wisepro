import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Save, Package } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

const categories = ['milk', 'paneer', 'curd', 'butter', 'ghee', 'buttermilk', 'cheese', 'other'];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', category: 'milk', description: '', price: '', unit: 'per liter',
    stock: '', lowStockThreshold: 10, image: '', isAvailable: true
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', category: 'milk', description: '', price: '', unit: 'per liter', stock: '', lowStockThreshold: 10, image: '', isAvailable: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name, category: product.category, description: product.description || '',
      price: product.price, unit: product.unit, stock: product.stock,
      lowStockThreshold: product.lowStockThreshold, image: product.image || '', isAvailable: product.isAvailable
    });
    setEditId(product._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/products/${editId}`, { ...form, price: Number(form.price), stock: Number(form.stock) });
        toast.success('Product updated');
      } else {
        await API.post('/products', { ...form, price: Number(form.price), stock: Number(form.stock) });
        toast.success('Product created');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-800">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Product Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                    {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Price (Rs)</label>
                  <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Stock</label>
                  <input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Low Stock At</label>
                  <input type="number" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Image URL</label>
                <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
                  className="rounded text-green-500 focus:ring-green-500" />
                <label className="text-sm text-gray-600">Available for sale</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                  <Save size={14} /> {editId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Products table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 overflow-hidden flex-shrink-0">
                          <img src={product.image || `https://placehold.co/100/e8f5e9/2e7d32?text=${product.name.charAt(0)}`}
                            alt="" className="w-full h-full object-cover"
                            onError={e => { e.target.src = `https://placehold.co/100/e8f5e9/2e7d32?text=${product.name.charAt(0)}`; }} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{product.category}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">Rs.{product.price}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.isAvailable ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500 transition">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(product._id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
