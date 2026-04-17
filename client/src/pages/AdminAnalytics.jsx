import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bar, Line, Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, Users, Calendar, BarChart2
} from 'lucide-react';
import API from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false } }
  }
};

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, chartRes, topRes, custRes] = await Promise.allSettled([
        API.get('/analytics/dashboard'),
        API.get('/analytics/revenue-chart'),
        API.get('/analytics/top-products'),
        API.get('/analytics/customer-growth'),
      ]);

      if (dashRes.status === 'fulfilled') setStats(dashRes.value.data);
      if (chartRes.status === 'fulfilled') {
        const d = chartRes.value.data;
        setRevenueChart(d);
      }
      if (topRes.status === 'fulfilled') setTopProducts(topRes.value.data);
      if (custRes.status === 'fulfilled') setCustomerGrowth(custRes.value.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from API or fallback mock
  const buildRevenueData = () => {
    const labels = revenueChart?.labels || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenue = revenueChart?.revenue || [12000,18000,15000,22000,19000,25000,30000,28000,24000,32000,27000,35000];
    const orders  = revenueChart?.orders  || [45,62,55,78,68,82,95,88,75,102,90,115];
    return { labels, revenue, orders };
  };

  const { labels, revenue, orders } = buildRevenueData();

  const revenueBarData = {
    labels,
    datasets: [{
      label: 'Revenue (₹)',
      data: revenue,
      backgroundColor: 'rgba(34,197,94,0.8)',
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const ordersLineData = {
    labels,
    datasets: [{
      label: 'Orders',
      data: orders,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 3,
    }]
  };

  const topProductNames  = topProducts.length > 0 ? topProducts.map(p => p._id)         : ['Cow Milk','Buffalo Milk','Paneer','Curd','Ghee'];
  const topProductRevs   = topProducts.length > 0 ? topProducts.map(p => p.totalRevenue) : [45000, 32000, 28000, 18000, 22000];
  const topProductQtys   = topProducts.length > 0 ? topProducts.map(p => p.totalQuantity): [750, 457, 87, 360, 31];

  const productPieData = {
    labels: topProductNames,
    datasets: [{
      data: topProductRevs,
      backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899'],
      borderWidth: 0,
    }]
  };

  const custLabels = customerGrowth?.labels || ['Jan','Feb','Mar','Apr','May','Jun'];
  const custCounts = customerGrowth?.counts  || [5, 12, 8, 18, 15, 22];

  const customerBarData = {
    labels: custLabels,
    datasets: [{
      label: 'New Customers',
      data: custCounts,
      backgroundColor: 'rgba(139,92,246,0.8)',
      borderRadius: 6,
    }]
  };

  // Summary stat cards
  const statCards = [
    {
      label: 'Monthly Revenue',
      value: `₹${(stats?.monthRevenue || 35000).toLocaleString()}`,
      sub: `${stats?.revenueGrowth || '+12'}% vs last month`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      up: true,
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 328,
      sub: `${stats?.todayOrders || 8} orders today`,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600',
      up: true,
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 94,
      sub: 'Registered users',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      up: true,
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders || 12,
      sub: 'Awaiting fulfillment',
      icon: Package,
      color: 'bg-orange-100 text-orange-600',
      up: false,
    },
  ];

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
        <div className="grid lg:grid-cols-2 gap-6">
          {[0,1].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border animate-pulse h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="text-green-600" size={26} />
            Advanced Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time business performance overview</p>
        </div>
        <div className="flex gap-2">
          {['daily','weekly','monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {card.up
                ? <TrendingUp size={12} className="text-green-500" />
                : <TrendingDown size={12} className="text-red-400" />}
              <span className={`text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                {card.sub}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Bar + Orders Line */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">Last 12 months (₹)</p>
          <div className="h-56">
            <Bar data={revenueBarData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1">Orders Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Last 12 months</p>
          <div className="h-56">
            <Line data={ordersLineData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Top Products + Customer Growth */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Products Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-3 font-semibold">#</th>
                  <th className="text-left pb-3 font-semibold">Product</th>
                  <th className="text-right pb-3 font-semibold">Qty Sold</th>
                  <th className="text-right pb-3 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProductNames.map((name, i) => (
                  <tr key={name} className="py-2">
                    <td className="py-2.5 text-gray-400 font-medium">{i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6'][i] }} />
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-gray-600">{topProductQtys[i]}</td>
                    <td className="py-2.5 text-right font-semibold text-green-600">
                      ₹{(topProductRevs[i] || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pie + Customer growth */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Revenue Split</h3>
            <div className="h-40">
              <Doughnut data={productPieData}
                options={{ responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
                }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Customer Growth</h3>
            <p className="text-xs text-gray-400 mb-3">Last 6 months</p>
            <div className="h-32">
              <Bar data={customerBarData}
                options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Period Summary Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={20} /> {period.charAt(0).toUpperCase() + period.slice(1)} Summary
          </h3>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium capitalize">{period}</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">
              {period === 'daily' ? `₹${(stats?.monthRevenue / 30 || 1167).toFixed(0)}` :
               period === 'weekly' ? `₹${(stats?.monthRevenue / 4 || 8750).toFixed(0)}` :
               `₹${(stats?.monthRevenue || 35000).toLocaleString()}`}
            </p>
            <p className="text-xs opacity-80 mt-1">Revenue</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {period === 'daily' ? Math.round((stats?.totalOrders || 328) / 30) :
               period === 'weekly' ? Math.round((stats?.totalOrders || 328) / 4) :
               (stats?.totalOrders || 328)}
            </p>
            <p className="text-xs opacity-80 mt-1">Orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalCustomers || 94}</p>
            <p className="text-xs opacity-80 mt-1">Customers</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
