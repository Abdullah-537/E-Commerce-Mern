import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

export default function CommissionSettings() {
  const [globalRate, setGlobalRate] = useState(10)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingVendor, setEditingVendor] = useState(null)
  const [vendorRate, setVendorRate] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [globalRes, vendorsRes] = await Promise.all([
        api.get('/admin/commission-settings'),
        api.get('/vendor')
      ])
      setGlobalRate(globalRes.data.data?.globalRate || 10)
      setVendors(vendorsRes.data.data || [])
    } catch (e) { toast.error('Failed to load settings') }
    setLoading(false)
  }

  const updateGlobalRate = async () => {
    try { await api.put('/admin/commission-settings', { globalRate }); toast.success('Global rate updated') } catch { toast.error('Failed') }
  }

  const updateVendorRate = async (vendorId) => {
    try { await api.put(`/vendor/${vendorId}/commission`, { commissionRate: Number(vendorRate) }); toast.success('Vendor rate updated'); setEditingVendor(null); setVendorRate(''); fetchData() } catch { toast.error('Failed') }
  }

  const statusColors = { approved: 'success', pending: 'warning', banned: 'danger' }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Commission Settings</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Commission Settings</h3>
        <p className="text-muted fs-9 mb-0">Configure the marketplace commission fee deduction rates globally or customize per-vendor overrides.</p>
      </div>

      <div className="row g-4">
        {/* Global Rate Card */}
        <div className="col-12 col-xl-4">
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-percentage me-2 text-primary"></span>Global Rate
              </h5>
            </div>
            <div className="card-body p-4">
              <p className="text-muted mb-4 fs-9">This commission percentage will be applied automatically to all sales from stores that do not have custom rate overrides.</p>
              <div className="d-flex align-items-center gap-3">
                <div className="input-group" style={{ maxWidth: '140px' }}>
                  <input 
                    type="number" 
                    className="form-control text-center fw-bold fs-8" 
                    value={globalRate} 
                    onChange={e => setGlobalRate(e.target.value)} 
                    min={0} 
                    max={100} 
                  />
                  <span className="input-group-text bg-light fw-bold border-translucent">%</span>
                </div>
                <button className="btn btn-primary fw-bold" onClick={updateGlobalRate}>
                  <span className="fas fa-save me-2"></span>Apply Global
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Vendor Overrides */}
        <div className="col-12 col-xl-8">
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-sliders-h me-2 text-info"></span>Store Commission Overrides
              </h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-5">
                  <span className="fas fa-store fs-3 text-muted d-block mb-2"></span>
                  <p className="text-muted mb-0 fw-semibold">No registered vendors found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Store Details</th>
                        <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                        <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '180px' }}>Commission Rate</th>
                        <th className="pe-4 py-3 text-end" style={{ width: '120px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(v => (
                        <tr key={v._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-3">
                              <div className="avatar avatar-m overflow-hidden">
                                {v.logo ? (
                                  <img className="rounded-circle w-100 h-100" src={v.logo} alt="" style={{ objectFit: 'cover' }} />
                                ) : (
                                  <div className={`avatar-name rounded-circle bg-${getAvatarColor(v.businessName)}-subtle text-${getAvatarColor(v.businessName)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                                    <span>{v.businessName?.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h6 className="mb-0 fw-semibold text-body-emphasis">{v.businessName}</h6>
                                <span className="text-muted fs-10">{v.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`badge badge-phoenix badge-phoenix-${statusColors[v.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="text-center">
                            {editingVendor === v._id ? (
                              <div className="d-flex gap-2 justify-content-center align-items-center">
                                <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                  <input 
                                    type="number" 
                                    className="form-control text-center fw-bold" 
                                    value={vendorRate} 
                                    onChange={e => setVendorRate(e.target.value)} 
                                    min={0} 
                                    max={100} 
                                  />
                                  <span className="input-group-text bg-light fw-bold border-translucent">%</span>
                                </div>
                                <button className="btn btn-phoenix-success btn-sm px-2 py-1 rounded" onClick={() => updateVendorRate(v._id)}>
                                  <span className="fas fa-check"></span>
                                </button>
                                <button className="btn btn-phoenix-secondary btn-sm px-2 py-1 rounded" onClick={() => setEditingVendor(null)}>
                                  <span className="fas fa-times"></span>
                                </button>
                              </div>
                            ) : (
                              <span className="fw-bold text-body-emphasis">{v.commissionRate || globalRate}%</span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            {editingVendor !== v._id && (
                              <button className="btn btn-phoenix-primary btn-xs fw-bold rounded-pill" onClick={() => { setEditingVendor(v._id); setVendorRate(v.commissionRate || '') }}>
                                <span className="fas fa-edit me-1"></span>Override
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}