import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

/**
 * PayNowModal - Handles UPI QR payment + marks order as paid in backend.
 * Props:
 *   isOpen, onClose, order, user, onPaymentSuccess
 */
export default function PayNowModal({ isOpen, onClose, order, user, onPaymentSuccess }) {
  const [step, setStep] = useState('qr'); // 'qr' | 'confirming' | 'success'
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const amount = order.totalAmount?.toFixed(0) || 0;
  const orderId = order._id?.slice(-6).toUpperCase();

  // WhatsApp deep link with pre-filled message
  const whatsappMsg = encodeURIComponent(
    `Hello Vasantdada Agency!\n\nI have paid for my order.\n\nOrder ID: #${orderId}\nAmount: ₹${amount}\nCustomer: ${user?.name || 'Customer'}\nPhone: ${user?.phone || 'N/A'}\n\nPlease confirm my payment. 🙏`
  );
  const whatsappUrl = `https://wa.me/918766997752?text=${whatsappMsg}`;

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Mark payment as paid on backend
      await API.patch(`/orders/${order._id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod: 'qr_code'
      });
      setStep('success');
      toast.success('Payment confirmed! Invoice ready to download.');
      onPaymentSuccess?.(order._id);
    } catch (err) {
      console.error('Payment confirm error:', err);
      toast.error('Could not confirm payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('qr');
    onClose();
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
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <ShieldCheck className="text-green-600" size={22} />
              Pay for Order #{orderId}
            </h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-xl transition">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {step === 'qr' && (
            <div className="p-5 space-y-4">
              {/* Amount */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Total Payable</p>
                <p className="text-4xl font-extrabold text-gray-900">₹{amount}</p>
              </div>

              {/* QR Codes */}
              <div className="flex justify-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-center">
                  <img src="/qrcode1.jpg" alt="PhonePe / GPay QR"
                    className="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Scan QR 1</p>
                </div>
                <div className="text-center">
                  <img src="/qrcode2.jpg" alt="GPay QR"
                    className="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Scan QR 2</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">UPI ID</p>
                <p className="font-mono text-sm font-semibold bg-gray-100 px-3 py-1.5 rounded-lg inline-block mt-1">
                  9975882125@okbizaxis
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              {/* WhatsApp button */}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="w-full py-3 bg-[#25D366] rounded-xl text-sm font-bold text-white hover:bg-[#128C7E] transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Pay via WhatsApp
              </a>

              {/* After paying, confirm button */}
              <button onClick={handleConfirmPayment} disabled={loading}
                className="w-full py-3 border-2 border-green-600 text-green-700 rounded-xl text-sm font-bold hover:bg-green-50 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Confirming...' : 'I Have Paid — Confirm Payment'}
              </button>

              <p className="text-[10px] text-center text-gray-400">
                After UPI payment, click "I Have Paid" to confirm and download your invoice.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-8 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle size={64} className="text-green-500 mx-auto" />
              </motion.div>
              <h4 className="text-xl font-bold text-gray-800">Payment Confirmed!</h4>
              <p className="text-sm text-gray-500">Your order #{orderId} is now marked as paid.</p>
              <p className="text-xs text-gray-400">Click "Download Invoice" below to get your PDF receipt.</p>
              <button onClick={handleClose}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition">
                Close & Download Invoice
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
