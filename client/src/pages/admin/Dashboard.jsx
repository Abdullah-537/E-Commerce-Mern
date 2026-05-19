import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ReactECharts from 'echarts-for-react'
import api from '../../store/api/baseApi'

export default function Dashboard() {
  const { user } = useSelector(state => state.auth)
  const [stats, setStats] = useState({ gmv: 0, commission: 0, activeVendors: 0, customers: 0, orders: 0, pendingVendors: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats/overview').catch(() => ({ data: { data: {} } })),
      api.get('/admin/stats/revenue').catch(() => ({ data: { data: [] } })),
      api.get('/admin/orders').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, revenueRes, ordersRes]) => {
      setStats(statsRes.data.data || {})
      setRevenueData(revenueRes.data.data || [])
      setRecentOrders((ordersRes.data.data || []).slice(0, 8))
    }).finally(() => setLoading(false))
  }, [])

  const kpiCards = [
    { label: 'Total Orders', value: stats.orders || 0, icon: 'fas fa-shopping-bag', color: 'primary', change: '', link: '/admin/orders' },
    { label: 'GMV (Gross)', value: `PKR ${(stats.gmv || 0).toLocaleString()}`, icon: 'fas fa-chart-line', color: 'success', change: '', link: '/admin/orders' },
    { label: 'Commission', value: `PKR ${(stats.commission || 0).toLocaleString()}`, icon: 'fas fa-money-bill-wave', color: 'info', change: '', link: '/admin/payouts' },
    { label: 'Customers', value: stats.customers || 0, icon: 'fas fa-users', color: 'warning', change: '', link: '/admin/customers' },
  ]

  const chartLabels = revenueData.length > 0 ? revenueData.map(r => r._id) : ['No Data']
  const chartValues = revenueData.length > 0 ? revenueData.map(r => r.revenue) : [0]

  const revenueChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: chartLabels, boundaryGap: false, axisLabel: { fontSize: 10, color: '#8a94a6' } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8a94a6' } },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        data: chartValues,
        areaStyle: { opacity: 0.12, color: '#3874ff' },
        lineStyle: { color: '#3874ff', width: 2 },
        itemStyle: { color: '#3874ff' }
      }
    ]
  }

  const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' }

  if (loading) {
    return <div className="text-center py-9"><div className="spinner-border text-primary" role="status"></div></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
        <div>
          <h3 className="text-body-emphasis mb-1">Good Morning, {user?.name || 'Admin'} 👋</h3>
          <p className="text-body-tertiary mb-0 fs-9">Here's what's happening with your marketplace today.</p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <Link to="/admin/products" className="btn btn-phoenix-primary btn-sm">
            <span className="fas fa-box-open me-1"></span>Products
          </Link>
          <Link to="/admin/vendors" className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-store me-1"></span>Vendors
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
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`btn-icon rounded-3 bg-${card.color} bg-opacity-10`} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className={`${card.icon} text-${card.color} fs-9`}></span>
                    </div>
                    {card.change && (
                      <span className="badge badge-phoenix badge-phoenix-success fs-11">
                        <span className="fas fa-caret-up me-1"></span>{card.change}
                      </span>
                    )}
                  </div>
                  <p className="text-body-tertiary fw-semibold mb-1 fs-10">{card.label}</p>
                  <h3 className="text-body-emphasis mb-0">{card.value}</h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pending Vendors Alert */}
      {(stats.pendingVendors > 0) && (
        <div className="card mb-4 border-warning border-opacity-25">
          <div className="card-body d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <span className="fas fa-exclamation-triangle text-warning me-3 fs-7"></span>
              <div>
                <h6 className="mb-0 text-body-emphasis">{stats.pendingVendors} vendor(s) pending approval</h6>
                <p className="mb-0 text-body-tertiary fs-10">Review and approve/reject pending vendor applications</p>
              </div>
            </div>
            <Link to="/admin/vendors" className="btn btn-sm btn-warning">Review Now</Link>
          </div>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Revenue Chart */}
        <div className="col-12 col-lg-8">
          <div className="card h-100 border-translucent">
            <div className="card-header bg-body-highlight border-bottom border-translucent d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-chart-line me-2 text-primary"></span>Revenue Overview
              </h5>
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#3874ff' }}></span>
                  <span className="text-body-tertiary fs-10">Revenue</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#25b003' }}></span>
                  <span className="text-body-tertiary fs-10">Orders</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <ReactECharts option={revenueChartOption} style={{ height: 300 }} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-translucent">
            <div className="card-header bg-body-highlight border-bottom border-translucent">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-bolt me-2 text-warning"></span>Quick Stats
              </h5>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-body-highlight">
                <div className="d-flex align-items-center gap-2">
                  <span className="fas fa-store text-success fs-9"></span>
                  <span className="text-body-emphasis fs-9">Active Vendors</span>
                </div>
                <span className="fw-bold text-body-emphasis fs-8">{stats.totalVendors || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-body-highlight">
                <div className="d-flex align-items-center gap-2">
                  <span className="fas fa-clock text-warning fs-9"></span>
                  <span className="text-body-emphasis fs-9">Pending Vendors</span>
                </div>
                <span className="fw-bold text-warning fs-8">{stats.pendingVendors || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-body-highlight">
                <div className="d-flex align-items-center gap-2">
                  <span className="fas fa-box-open text-info fs-9"></span>
                  <span className="text-body-emphasis fs-9">Total Products</span>
                </div>
                <span className="fw-bold text-body-emphasis fs-8">{stats.totalProducts || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-body-highlight">
                <div className="d-flex align-items-center gap-2">
                  <span className="fas fa-users text-primary fs-9"></span>
                  <span className="text-body-emphasis fs-9">Total Customers</span>
                </div>
                <span className="fw-bold text-body-emphasis fs-8">{stats.totalCustomers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card border-translucent">
        <div className="card-header bg-body-highlight border-bottom border-translucent d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-body-emphasis">
            <span className="fas fa-history me-2 text-primary"></span>Recent Orders
          </h5>
          <Link to="/admin/orders" className="btn btn-sm btn-phoenix-primary">View All</Link>
        </div>
        <div className="card-body p-0">
          {recentOrders.length > 0 ? (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Order</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Customer</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Date</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Total</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id}>
                      <td className="align-middle ps-3">
                        <Link to={`/admin/orders/${o._id}`} className="fw-semibold text-primary text-decoration-none">#{o._id?.slice(-6).toUpperCase()}</Link>
                      </td>
                      <td className="align-middle text-body-emphasis">{o.customerId?.name || 'Unknown'}</td>
                      <td className="align-middle text-body-tertiary fs-10">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                      <td className="align-middle text-end fw-bold text-body-emphasis">PKR {o.totalAmount?.toLocaleString()}</td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} fs-10`}>{o.status}</span>
                      </td>
                      <td className="align-middle text-end pe-3">
                        <Link to={`/admin/orders/${o._id}`} className="btn btn-phoenix-secondary btn-sm px-2 py-0"><span className="fas fa-eye fs-10"></span></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <span className="fas fa-shopping-bag fs-5 text-body-quaternary d-block mb-2"></span>
              <p className="text-body-tertiary mb-0">No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}