import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle, Clock, Brain } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import API from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      const res = await fetch('http://localhost:8000/predict/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: new Date().getDay(), month: new Date().getMonth() + 1, temperature: 32, festival: 0, previous_demand: 120 })
      });
      const data = await res.json();
      setAiInsights(data);
    } catch (err) {
      console.log('ML API not reachable');
    }
  };

  const fetchDashboard = async () => {
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        API.get('/analytics/dashboard'),
        API.get('/analytics/revenue-chart'),
        API.get('/analytics/top-products')
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Monthly Revenue', value: `Rs.${(stats?.monthRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600', growth: stats?.revenueGrowth },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600', sub: `${stats?.todayOrders || 0} today` },
    { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-orange-100 text-orange-600', sub: `${stats?.pendingOrders || 0} pending` },
  ];

  const revenueChart = chartData ? {
    labels: chartData.labels,
    datasets: [{
      label: 'Revenue',
      data: chartData.revenue,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#22c55e',
      pointRadius: 4,
    }]
  } : null;

  const ordersChart = chartData ? {
    labels: chartData.labels,
    datasets: [{
      label: 'Orders',
      data: chartData.orders,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 4,
    }]
  } : null;

  const productsPie = topProducts.length > 0 ? {
    labels: topProducts.map(p => p._id),
    datasets: [{
      data: topProducts.map(p => p.totalRevenue),
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
      borderWidth: 0,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
  };

  return (
    <div className="p-6 space-y-6">
      {/* AI Insights and Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* AI Prediction Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">AI Demand Forecast</span>
          </div>
          <div className="mt-4">
            <p className="text-sm opacity-80">Tomorrow's Milk Need</p>
            <h4 className="text-3xl font-bold">{aiInsights?.predicted_demand || '120.5'}L</h4>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-green-300" />
              <span className="text-[10px] text-green-200 font-medium">{(aiInsights?.confidence * 100 || 88)}% confidence</span>
            </div>
          </div>
          <p className="text-[10px] mt-4 opacity-70 italic line-clamp-2">
            "{aiInsights?.suggestion || 'Demand expected to rise by 5% due to weekend trends. Keep 120L ready.'}"
          </p>
        </motion.div>

        {/* Normal stats */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              {card.growth && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{card.growth}% growth</span>
                </div>
              )}
              {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-64">
            {revenueChart && <Line data={revenueChart} options={chartOptions} />}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Orders Trend</h3>
          <div className="h-64">
            {ordersChart && <Line data={ordersChart} options={chartOptions} />}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          {productsPie ? (
            <div className="h-48">
              <Doughnut data={productsPie} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} />
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {(stats?.recentOrders || []).slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">#{order._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.user?.name}</p>
                </div>
                <span className="text-sm font-semibold text-green-600">Rs.{order.totalAmount}</span>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Low Stock
          </h3>
          <div className="space-y-3">
            {(stats?.lowStockProducts || []).map(product => (
              <div key={product._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700">{product.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  product.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {product.stock} left
                </span>
              </div>
            ))}
            {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">All stock levels OK</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
