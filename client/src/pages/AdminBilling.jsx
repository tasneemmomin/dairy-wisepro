import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await API.get('/billing');
      setBills(res.data);
    } catch (err) {
      console.error('Billing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      await API.post('/billing/generate-all', { month: filterMonth, year: filterYear });
      toast.success(`Bills generated for ${filterMonth}/${filterYear}`);
      fetchBills();
    } catch (err) {
      toast.error('Failed to generate bills');
    } finally {
      setGenerating(false);
    }
  };

  const markAsPaid = async (billId) => {
    try {
      await API.put(`/billing/${billId}`, { status: 'Paid', paidAmount: bills.find(b => b._id === billId).totalAmount });
      toast.success('Payment marked as paid');
      fetchBills();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Monthly Billing</h1>
          <p className="text-sm text-gray-500">Manage customer invoices and payments</p>
        </div>
        <button 
          onClick={handleGenerateBills}
          disabled={generating}
          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          <FileText size={18} />
          {generating ? 'Generating...' : 'Generate All Bills'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customer..." 
              className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month/Year</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-400 animate-pulse">Loading invoices...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-400">No invoices found. Generate bills first.</td></tr>
              ) : bills.map((bill) => (
                <motion.tr key={bill._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-800">{bill.customer?.name}</p>
                    <p className="text-xs text-gray-500">{bill.customer?.phone}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(0, bill.month-1).toLocaleString('en', { month: 'short' })} {bill.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">
                    Rs.{bill.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                       {bill.status !== 'Paid' && (
                         <button 
                           onClick={() => markAsPaid(bill._id)}
                           className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                           title="Mark as Paid"
                         >
                           <CheckCircle size={18} />
                         </button>
                       )}
                       <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Download Invoice">
                         <Download size={18} />
                       </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
