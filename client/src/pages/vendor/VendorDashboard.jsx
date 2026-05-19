import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ReactECharts from 'echarts-for-react'
import api from '../../store/api/baseApi'

export default function VendorDashboard() {
  const { user } = useSelector(state => state.auth)
  const [stats, setStats] = useState({ products: 0, orders: 0, earnings: 0, balance: 0, pendingOrders: 0, totalReviews: 0, allOrders: [] })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/vendor/profile'),
      api.get('/orders/vendor/orders'),
      api.get('/products/my-products'),
    ]).then(([profileRes, ordersRes, productsRes]) => {
      const v = profileRes.data.data
      const orders = ordersRes.data.data || []
      const products = productsRes.data.data || []
      setStats({
        products: products.length,
        orders: orders.length,
        earnings: v.totalEarnings || 0,
        balance: v.availableBalance || 0,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
        totalReviews: 0,
        allOrders: orders
      })
      setRecentOrders(orders.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const kpiCards = [
    { label: 'Total Products', value: stats.products, icon: 'fas fa-box-open', color: 'primary', link: '/vendor/products' },
    { label: 'Total Orders', value: stats.orders, icon: 'fas fa-shopping-bag', color: 'success', link: '/vendor/orders' },
    { label: 'Total Earnings', value: `PKR ${stats.earnings.toLocaleString()}`, icon: 'fas fa-wallet', color: 'warning', link: '/vendor/earnings' },
    { label: 'Available Balance', value: `PKR ${stats.balance.toLocaleString()}`, icon: 'fas fa-money-bill-wave', color: 'info', link: '/vendor/payouts' },
  ]

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  
  const chartLabels = last7Days.map(date => {
    const [y, m, d] = date.split('-')
    return `${d}/${m}`
  })
  
  const chartValues = last7Days.map(date => {
    return stats.allOrders.filter(o => o.createdAt?.startsWith(date)).length || 0
  })

  const chartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: chartLabels, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [{
      name: 'Orders',
      type: 'line',
      smooth: true,
      data: chartValues,
      areaStyle: { opacity: 0.15, color: '#3874ff' },
      lineStyle: { color: '#3874ff', width: 2 },
      itemStyle: { color: '#3874ff' }
    }]
  }

  if (loading) {
    return (
      <div className="text-center py-9">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
        <div>
          <h3 className="text-body-emphasis mb-1">
            Welcome back, {user?.vendor?.businessName || user?.name} 👋
          </h3>
          <p className="text-body-tertiary mb-0 fs-9">Here's what's happening with your store today.</p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <Link to="/vendor/products/add" className="btn btn-primary btn-sm">
            <span className="fas fa-plus me-1"></span>Add Product
          </Link>
          <Link to="/vendor/orders" className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-shopping-bag me-1"></span>View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-5">
        {kpiCards.map((card, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <Link to={card.link} className="text-decoration-none">
              <div className="card h-100 border-translucent hover-shadow">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-body-tertiary fw-semibold mb-1 fs-10">{card.label}</p>
                      <h3 className="text-body-emphasis mb-0">{card.value}</h3>
                    </div>
                    <div className={`btn btn-icon rounded-3 bg-${card.color} bg-opacity-10`}>
                      <span className={`${card.icon} text-${card.color}`}></span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pending Orders Alert */}
      {stats.pendingOrders > 0 && (
        <div className="card mb-4 border-warning border-opacity-25">
          <div className="card-body d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <span className="fas fa-exclamation-triangle text-warning me-3 fs-7"></span>
              <div>
                <h6 className="mb-0 text-body-emphasis">{stats.pendingOrders} pending order(s) need attention</h6>
                <p className="mb-0 text-body-tertiary fs-10">Process these orders to keep your customers happy</p>
              </div>
            </div>
            <Link to="/vendor/orders" className="btn btn-sm btn-warning">Process Now</Link>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Chart */}
        <div className="col-12 col-lg-8">
          <div className="card h-100">
            <div className="card-header bg-body-highlight border-bottom border-translucent d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-chart-line me-2 text-primary"></span>Weekly Orders
              </h5>
            </div>
            <div className="card-body">
              <ReactECharts option={chartOption} style={{ height: 280 }} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-body-highlight border-bottom border-translucent">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-bolt me-2 text-warning"></span>Quick Actions
              </h5>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              <Link to="/vendor/products/add" className="btn btn-phoenix-primary text-start d-flex align-items-center gap-2 py-3">
                <span className="fas fa-plus-circle text-primary"></span>
                <div>
                  <h6 className="mb-0 fs-9">Add New Product</h6>
                  <p className="mb-0 text-body-tertiary fs-10">List a new item in your store</p>
                </div>
              </Link>
              <Link to="/vendor/payouts" className="btn btn-phoenix-success text-start d-flex align-items-center gap-2 py-3">
                <span className="fas fa-credit-card text-success"></span>
                <div>
                  <h6 className="mb-0 fs-9">Request Payout</h6>
                  <p className="mb-0 text-body-tertiary fs-10">Withdraw your available balance</p>
                </div>
              </Link>
              <Link to="/vendor/profile" className="btn btn-phoenix-info text-start d-flex align-items-center gap-2 py-3">
                <span className="fas fa-store text-info"></span>
                <div>
                  <h6 className="mb-0 fs-9">Store Settings</h6>
                  <p className="mb-0 text-body-tertiary fs-10">Update your store information</p>
                </div>
              </Link>
              <Link to="/vendor/reviews" className="btn btn-phoenix-warning text-start d-flex align-items-center gap-2 py-3">
                <span className="fas fa-star text-warning"></span>
                <div>
                  <h6 className="mb-0 fs-9">View Reviews</h6>
                  <p className="mb-0 text-body-tertiary fs-10">See what customers are saying</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card mt-4">
        <div className="card-header bg-body-highlight border-bottom border-translucent d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-body-emphasis">
            <span className="fas fa-history me-2 text-primary"></span>Recent Orders
          </h5>
          <Link to="/vendor/orders" className="btn btn-sm btn-phoenix-primary">View All</Link>
        </div>
        <div className="card-body p-3">
          {recentOrders.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0 fs-9">
                <thead>
                  <tr>
                    <th className="text-body-tertiary">Order ID</th>
                    <th className="text-body-tertiary">Customer</th>
                    <th className="text-body-tertiary">Date</th>
                    <th className="text-body-tertiary">Status</th>
                    <th className="text-body-tertiary text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>
                        <Link to={`/vendor/orders/${order._id}`} className="fw-semibold text-body-emphasis">
                          #{order._id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="text-body-tertiary">{order.userId?.name || 'Customer'}</td>
                      <td className="text-body-tertiary">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-phoenix badge-phoenix-${
                          order.status === 'delivered' ? 'success' :
                          order.status === 'shipped' ? 'info' :
                          order.status === 'processing' ? 'warning' :
                          order.status === 'cancelled' ? 'danger' : 'secondary'
                        } fs-10`}>{order.status}</span>
                      </td>
                      <td className="text-end fw-semibold text-body-emphasis">PKR {order.totalAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <span className="fas fa-shopping-bag fs-5 text-body-quaternary d-block mb-2"></span>
              <p className="text-body-tertiary mb-0">No orders yet. Start adding products!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}