import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, AlertTriangle, TrendingUp } from 'lucide-react';
import API from '../services/api';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/products').then(res => setProducts(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.stock <= p.lowStockThreshold);
  const outOfStock = products.filter(p => p.stock <= 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Warehouse size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Stock</p>
              <p className="text-xl font-bold text-gray-800">{totalStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><AlertTriangle size={18} className="text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Low Stock Items</p>
              <p className="text-xl font-bold text-orange-600">{lowStock.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle size={18} className="text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{outOfStock.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Low Threshold</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const pct = product.stock / (product.lowStockThreshold * 5) * 100;
                const isLow = product.stock <= product.lowStockThreshold;
                const isOut = product.stock <= 0;
                return (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{product.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{product.category}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-bold ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{product.lowStockThreshold}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                        isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
