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
    <div className="pb-5">
      {/* Welcome Banner */}
      <div className="card border-0 mb-4 text-white overflow-hidden shadow-sm" style={{
        background: 'linear-gradient(135deg, #0051d4 0%, #002d80 100%)',
        borderRadius: '16px'
      }}>
        <div className="card-body p-4 p-md-5 position-relative">
          <div className="row align-items-center justify-content-between">
            <div className="col-12 col-md-8">
              <h2 className="fw-extrabold text-white mb-2 tracking-tight">Welcome back, {user?.name || 'Admin'}! 👋</h2>
              <p className="text-white-50 mb-0 fs-9 fs-md-8">Here is your ShopZone marketplace summary. Monitor vendor status, review requests, and track global orders seamlessly.</p>
            </div>
            <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-start justify-content-md-end">
              <Link to="/admin/products" className="btn btn-light text-primary btn-sm fw-bold px-3 py-2 shadow-sm rounded-pill">
                <span className="fas fa-box-open me-1"></span>Catalog
              </Link>
              <Link to="/admin/vendors" className="btn btn-outline-light btn-sm fw-bold px-3 py-2 rounded-pill">
                <span className="fas fa-store me-1"></span>Vendors
              </Link>
            </div>
          </div>
          {/* Subtle background circles for premium design */}
          <div className="position-absolute" style={{ right: '-50px', bottom: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
          <div className="position-absolute" style={{ right: '50px', top: '-50px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card, i) => (
          <div className="col-12 col-sm-6 col-lg-3" key={i}>
            <Link to={card.link} className="text-decoration-none">
              <div className="card h-100 border-translucent shadow-sm hover-shadow" style={{ transition: 'all 0.3s ease', borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted fw-bold fs-10 uppercase tracking-wider">{card.label}</span>
                    <div className={`rounded-circle bg-${card.color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width: 44, height: 44 }}>
                      <span className={`${card.icon} text-${card.color} fs-9`}></span>
                    </div>
                  </div>
                  <h3 className="text-body-emphasis fw-bold mb-0">{card.value}</h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pending Vendors Alert Banner */}
      {(stats.pendingVendors > 0) && (
        <div className="alert alert-warning border-0 shadow-sm d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 mb-4" style={{ borderRadius: '12px', background: 'rgba(244, 180, 0, 0.08)' }}>
          <div className="d-flex align-items-center mb-2 mb-sm-0">
            <div className="bg-warning bg-opacity-15 rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <span className="fas fa-exclamation-triangle text-warning fs-8"></span>
            </div>
            <div>
              <h6 className="alert-heading mb-0 fw-bold text-warning-emphasis">{stats.pendingVendors} Vendor Applications Pending</h6>
              <p className="mb-0 text-muted fs-10">New business accounts are waiting for audit before store activation.</p>
            </div>
          </div>
          <Link to="/admin/vendors" className="btn btn-warning btn-sm fw-bold px-3 py-2 rounded-pill shadow-sm">Review Applications</Link>
        </div>
      )}

      {/* Main Charts & Quick Statistics */}
      <div className="row g-4 mb-4">
        {/* Revenue Chart */}
        <div className="col-12 col-lg-8">
          <div className="card h-100 border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-chart-line me-2 text-primary"></span>Revenue Overview
              </h5>
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#3874ff' }}></span>
                  <span className="text-muted fs-10 fw-semibold">Revenue</span>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <ReactECharts option={revenueChartOption} style={{ height: 290 }} />
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-bolt me-2 text-warning"></span>System Audit
              </h5>
            </div>
            <div className="card-body p-4 d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fas fa-store"></span>
                  </div>
                  <div>
                    <span className="text-muted fs-10 d-block fw-semibold uppercase">Active Stores</span>
                    <strong className="text-body-emphasis fs-8">{stats.totalVendors || 0}</strong>
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fas fa-clock"></span>
                  </div>
                  <div>
                    <span className="text-muted fs-10 d-block fw-semibold uppercase">Pending Stores</span>
                    <strong className="text-warning fs-8">{stats.pendingVendors || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fas fa-box-open"></span>
                  </div>
                  <div>
                    <span className="text-muted fs-10 d-block fw-semibold uppercase">Total Catalog Items</span>
                    <strong className="text-body-emphasis fs-8">{stats.totalProducts || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fas fa-users"></span>
                  </div>
                  <div>
                    <span className="text-muted fs-10 d-block fw-semibold uppercase">Registered Shoppers</span>
                    <strong className="text-body-emphasis fs-8">{stats.totalCustomers || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-header bg-white border-bottom border-translucent py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-body-emphasis fw-bold">
            <span className="fas fa-history me-2 text-primary"></span>Recent Master Orders
          </h5>
          <Link to="/admin/orders" className="btn btn-outline-primary btn-sm fw-bold px-3 py-1.5 rounded-pill">View All Orders</Link>
        </div>
        <div className="card-body p-0">
          {recentOrders.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11" style={{ width: '130px' }}>Order ID</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Customer</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Date</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '150px' }}>Total Amount</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="pe-4 py-3" style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id}>
                      <td className="ps-4">
                        <Link to={`/admin/orders/${o._id}`} className="fw-bold text-primary text-decoration-none">
                          #{o._id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="fw-semibold text-body-emphasis">
                        {o.customerId ? (
                          <Link to={`/admin/customers/${o.customerId._id}`} className="text-body-emphasis text-decoration-none hover-primary">
                            {o.customerId.name}
                          </Link>
                        ) : 'Guest User'}
                      </td>
                      <td className="text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      <td className="text-end fw-bold text-body-emphasis">PKR {o.totalAmount?.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <Link to={`/admin/orders/${o._id}`} className="btn btn-phoenix-secondary btn-sm p-2 rounded-circle" title="View details">
                          <span className="fas fa-eye fs-10"></span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <span className="fas fa-shopping-bag fs-3 text-muted d-block mb-3"></span>
              <p className="text-muted mb-0 fw-semibold">No orders record found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}