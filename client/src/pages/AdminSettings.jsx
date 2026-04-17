import { motion } from 'framer-motion';
import { Settings, User, Phone, MapPin, Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Business info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings size={18} className="text-green-600" /> Business Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Business Name</label>
              <input type="text" value="Vasant Dairy Agency" readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Owner</label>
              <input type="text" value="Kedar Patil" readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone 1</label>
                <input type="text" value="8766997752" readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone 2</label>
                <input type="text" value="9975882125" readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
              <input type="text" value="Sangli, Maharashtra" readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
            </div>
          </div>
        </motion.div>

        {/* App settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Application Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">Low Stock Alerts</p>
                <p className="text-xs text-gray-400">Get notified when stock is low</p>
              </div>
              <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">Order Notifications</p>
                <p className="text-xs text-gray-400">Real-time order updates</p>
              </div>
              <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">AI Predictions</p>
                <p className="text-xs text-gray-400">Enable ML-based insights</p>
              </div>
              <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Auto Billing</p>
                <p className="text-xs text-gray-400">Auto-charge subscriptions</p>
              </div>
              <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
