import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentModal({ isOpen, onClose, totalAmount, onConfirm, whatsappUrl }) {
  if (!isOpen) return null;

  const handleWhatsAppPay = () => {
    onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <ShieldCheck className="text-green-600" size={24} />
              Secure Checkout
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Total Payable Amount</p>
              <h4 className="text-4xl font-extrabold text-gray-900">₹{totalAmount?.toFixed(0) || 0}</h4>
            </div>

            {/* Uploaded Payment QR Codes */}
            <div className="flex justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <img 
                src="/qrcode1.jpg" 
                alt="PhonePe QR" 
                className="w-32 h-32 object-contain rounded-lg shadow-sm border border-gray-200 bg-white"
              />
              <img 
                src="/qrcode2.jpg" 
                alt="GPay QR" 
                className="w-32 h-32 object-contain rounded-lg shadow-sm border border-gray-200 bg-white"
              />
            </div>
            
            <div className="text-center">
               <p className="text-xs text-gray-500 mb-1">Scan to pay with any UPI app</p>
               <p className="font-medium text-sm text-gray-700 font-mono bg-gray-100 py-1.5 px-3 rounded-lg inline-block">9975882125@okbizaxis</p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <p className="text-xs text-center text-gray-400">
               Click below to automatically share details with the Agency owner.
            </p>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
              onClick={handleWhatsAppPay}
              className="w-full py-3.5 bg-[#25D366] rounded-xl text-sm font-bold text-white hover:bg-[#128C7E] transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Complete Payment via WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
