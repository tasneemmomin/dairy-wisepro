import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, MapPin, Mail } from 'lucide-react';
import API from '../services/api';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/auth/users').then(res => {
      setCustomers(res.data.filter(u => u.role?.toLowerCase() === 'customer'));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <p className="text-sm text-gray-500">{customers.length} registered customers</p>
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
      ) : customers.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No customers yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer, i) => (
            <motion.div key={customer._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
                  {customer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{customer.name}</h3>
                  <p className="text-xs text-gray-400">Joined {new Date(customer.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={12} /> {customer.email || 'N/A'}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone size={12} /> {customer.phone}
                  </div>
                )}
                {customer.address?.city && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin size={12} /> {customer.address.street}, {customer.address.city}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
