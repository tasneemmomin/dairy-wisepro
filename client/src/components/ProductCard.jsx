import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const inCart = items.find(i => i._id === product._id);

  const stockLabel = product.stock <= 0 ? 'Out of Stock' :
    product.stock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock';
  const stockColor = product.stock <= 0 ? 'text-red-500 bg-red-50' :
    product.stock <= product.lowStockThreshold ? 'text-orange-500 bg-orange-50' : 'text-green-600 bg-green-50';

  const fallbackImg = `https://placehold.co/400x300/e8f5e9/2e7d32?text=${encodeURIComponent(product.name)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col"
    >
      <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
        <img
          src={imgError ? fallbackImg : product.image || fallbackImg}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${stockColor}`}>
            {stockLabel}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-gray-600 capitalize backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{product.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-xl font-bold text-green-600">Rs.{product.price}</span>
            <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>
          </div>

          {product.stock > 0 ? (
            inCart ? (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-2 py-1">
                <button onClick={() => addToCart(product, -1)}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm hover:bg-gray-50">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-semibold text-green-700 w-5 text-center">{inCart.quantity}</span>
                <button onClick={() => addToCart(product, 1)}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm hover:bg-gray-50">
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => addToCart(product)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
                <ShoppingCart size={14} /> Add
              </button>
            )
          ) : (
            <span className="text-xs text-red-400 font-medium">Unavailable</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
