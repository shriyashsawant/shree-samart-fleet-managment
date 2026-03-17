import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { analyticsAPI, billAPI } from '../api/analytics';
import { motion } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [vehicleProfit, setVehicleProfit] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [gstSummary, setGstSummary] = useState([]);
  const [partyRevenue, setPartyRevenue] = useState([]);
  const [idleAlerts, setIdleAlerts] = useState([]);
  const [documentHealth, setDocumentHealth] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [vehicles, setVehicles] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [profit, monthly, expense, gst, party, alerts] = await Promise.all([
        analyticsAPI.getVehicleProfit(),
        analyticsAPI.getMonthlyProfit(12),
        analyticsAPI.getExpenseBreakdown(),
        analyticsAPI.getGstSummary(12),
        analyticsAPI.getPartyRevenue(),
        analyticsAPI.getIdleAlerts(),
      ]);
      
      setVehicleProfit(profit.data);
      setMonthlyProfit(monthly.data);
      setExpenseBreakdown(expense.data);
      setGstSummary(gst.data);
      setPartyRevenue(party.data);
      setIdleAlerts(alerts.data);
      
      const vehiclesRes = await fetch('http://localhost:8080/api/vehicles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const vehiclesData = await vehiclesRes.json();
      setVehicles(vehiclesData);
      
      const healthPromises = vehiclesData.map(v => 
        analyticsAPI.getDocumentHealth(v.id).catch(() => null)
      );
      const healthResults = await Promise.all(healthPromises);
      setDocumentHealth(healthResults.filter(h => h !== null).map(h => h.data));
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'vehicle-profit', label: 'Vehicle P&L', icon: '🚛' },
    { id: 'profit-trend', label: 'Profit Trend', icon: '📈' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'gst', label: 'GST Summary', icon: '🧾' },
    { id: 'parties', label: 'Party Revenue', icon: '🤝' },
    { id: 'alerts', label: 'Idle Alerts', icon: '⚠️' },
    { id: 'document-health', label: 'Doc Health', icon: '📁' },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-lg"
      >
        <h3 className="text-blue-100 text-sm font-medium">Total Revenue</h3>
        <p className="text-3xl font-bold mt-2">
          {formatCurrency(monthlyProfit.reduce((sum, m) => sum + (m.revenue || 0), 0))}
        </p>
        <p className="text-blue-200 text-sm mt-2">All Time</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white shadow-lg"
      >
        <h3 className="text-red-100 text-sm font-medium">Total Expenses</h3>
        <p className="text-3xl font-bold mt-2">
          {formatCurrency(monthlyProfit.reduce((sum, m) => sum + (m.expenses || 0), 0))}
        </p>
        <p className="text-red-200 text-sm mt-2">All Time</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white shadow-lg"
      >
        <h3 className="text-green-100 text-sm font-medium">Total Profit</h3>
        <p className="text-3xl font-bold mt-2">
          {formatCurrency(monthlyProfit.reduce((sum, m) => sum + (m.profit || 0), 0))}
        </p>
        <p className="text-green-200 text-sm mt-2">All Time</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white shadow-lg"
      >
        <h3 className="text-purple-100 text-sm font-medium">Active Alerts</h3>
        <p className="text-3xl font-bold mt-2">{idleAlerts.length}</p>
        <p className="text-purple-200 text-sm mt-2">Vehicles Need Attention</p>
      </motion.div>
    </div>
  );

  const renderVehicleProfit = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Vehicle P&L Report</h2>
      <p className="text-gray-600 mb-4">Revenue - Expenses = Profit per Mixer</p>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Model</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Revenue</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Expenses</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Profit</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Margin</th>
            </tr>
          </thead>
          <tbody>
            {vehicleProfit.map((vehicle, index) => (
              <motion.tr 
                key={vehicle.vehicleId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-800">{vehicle.vehicleNumber}</td>
                <td className="px-4 py-3 text-gray-600">{vehicle.model}</td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(vehicle.totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(vehicle.totalExpenses)}</td>
                <td className={`px-4 py-3 text-right font-bold ${vehicle.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(vehicle.profit)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    vehicle.profitMargin >= 30 ? 'bg-green-100 text-green-700' :
                    vehicle.profitMargin >= 10 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {vehicle.profitMargin || 0}%
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {vehicleProfit.length > 0 && (
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleProfit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicleNumber" />
              <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="totalRevenue" name="Revenue" fill="#22c55e" />
              <Bar dataKey="totalExpenses" name="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderProfitTrend = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Monthly Profit Trend</h2>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyProfit}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Expense Breakdown</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">%</th>
              </tr>
            </thead>
            <tbody>
              {expenseBreakdown.map((item, index) => (
                <tr key={item.category} className="border-t border-gray-100">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {item.category}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGstSummary = () => {
    const handleExportGst = async () => {
      setExporting(true);
      try {
        const response = await billAPI.exportGstMonthly(selectedMonth);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `GST_Summary_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting GST:', error);
        alert('Failed to export GST. Please try again.');
      }
      setExporting(false);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">GST Summary Report</h2>
            <p className="text-gray-600">Monthly CGST/SGST totals for filing</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={handleExportGst}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Month</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Basic Amount</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">CGST</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">SGST</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total GST</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Amount</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Bills</th>
              </tr>
            </thead>
            <tbody>
              {gstSummary.map((gst, index) => (
                <motion.tr 
                  key={`${gst.month}-${gst.year}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-3 font-medium">{gst.month} {gst.year}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(gst.basicAmount)}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(gst.cgstAmount)}</td>
                  <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(gst.sgstAmount)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(gst.totalGst)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(gst.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                      {gst.billCount}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPartyRevenue = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Party Wise Revenue</h2>
      <p className="text-gray-600 mb-4">Which client gives most business</p>
      
      {partyRevenue.length > 0 ? (
        <>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyRevenue.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `₹${value / 100000}L`} />
                <YAxis dataKey="partyName" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Party Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">GST Number</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Revenue</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Bills</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {partyRevenue.map((party, index) => (
                  <motion.tr 
                    key={party.clientId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">{party.partyName}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{party.gstNumber || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(party.totalRevenue)}</td>
                    <td className="px-4 py-3 text-center">{party.billCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                        {party.percentage}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No party data available</p>
          <p className="text-sm">Add clients and generate bills to see revenue by party</p>
        </div>
      )}
    </div>
  );

  const renderIdleAlerts = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Idle Cost Alerts</h2>
      <p className="text-gray-600 mb-4">Flag vehicles with high expense, low revenue</p>
      
      {idleAlerts.length > 0 ? (
        <div className="space-y-4">
          {idleAlerts.map((alert, index) => (
            <motion.div 
              key={alert.vehicleId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'HIGH' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{alert.vehicleNumber}</h3>
                  <p className="text-sm text-gray-600">{alert.model}</p>
                  <p className="text-sm mt-2">{alert.alertReason}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  alert.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Expenses</p>
                  <p className="font-medium text-red-600">{formatCurrency(alert.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Revenue</p>
                  <p className="font-medium text-green-600">{formatCurrency(alert.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-gray-500">P&L</p>
                  <p className={`font-medium ${alert.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(alert.profitLoss)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl font-medium text-gray-800">All vehicles are performing well!</p>
          <p className="text-gray-500">No idle cost alerts at this time</p>
        </div>
      )}
    </div>
  );

  const renderDocumentHealth = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Health Score</h2>
      <p className="text-gray-600 mb-4">Vehicle document compliance tracking (0-100 score)</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {documentHealth.map((doc) => (
          <motion.div
            key={doc.vehicleId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-xl p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{doc.vehicleNumber}</h3>
                <p className="text-sm text-gray-500">{doc.totalDocs} documents</p>
              </div>
              <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                doc.grade === 'A' ? 'bg-green-100 text-green-700' :
                doc.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                doc.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {doc.score}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    doc.score >= 90 ? 'bg-green-500' :
                    doc.score >= 70 ? 'bg-blue-500' :
                    doc.score >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${doc.score}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{doc.validCount} Valid</span>
              <span className="text-yellow-600">{doc.expiringCount} Expiring</span>
              <span className="text-red-600">{doc.expiredCount} Expired</span>
            </div>
            
            <div className="mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                doc.status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                doc.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {doc.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {documentHealth.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No vehicle data available</p>
          <p className="text-sm">Add vehicles to see document health scores</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-600">Fleet Financial Intelligence Dashboard</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {renderOverview()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Vehicle</h3>
                {vehicleProfit.length > 0 && (
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">{vehicleProfit[0]?.vehicleNumber}</p>
                    <p className="text-gray-600">{vehicleProfit[0]?.model}</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(vehicleProfit[0]?.profit)}</p>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top Revenue Party</h3>
                {partyRevenue.length > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{partyRevenue[0]?.partyName}</p>
                    <p className="text-gray-600">{partyRevenue[0]?.billCount} bills</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(partyRevenue[0]?.totalRevenue)}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {activeTab === 'vehicle-profit' && renderVehicleProfit()}
        {activeTab === 'profit-trend' && renderProfitTrend()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'gst' && renderGstSummary()}
        {activeTab === 'parties' && renderPartyRevenue()}
        {activeTab === 'alerts' && renderIdleAlerts()}
        {activeTab === 'document-health' && renderDocumentHealth()}
      </div>
    </div>
  );
};

export default Analytics;
