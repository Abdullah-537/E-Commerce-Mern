import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

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
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-1"><li className="breadcrumb-item"><Link to="/admin">Admin</Link></li><li className="breadcrumb-item active">Commission</li></ol></nav>
          <h3 className="text-body-emphasis mb-0">Commission Settings</h3>
        </div>
      </div>

      {/* Global Rate Card */}
      <div className="card border-translucent mb-4">
        <div className="card-header bg-body-highlight border-bottom border-translucent">
          <h5 className="mb-0 text-body-emphasis"><span className="fas fa-percentage me-2 text-primary"></span>Global Commission Rate</h5>
        </div>
        <div className="card-body">
          <p className="text-body-tertiary mb-3 fs-9">This rate applies to all vendors without a custom override.</p>
          <div className="d-flex align-items-center gap-3">
            <div className="input-group" style={{ maxWidth: 160 }}>
              <input type="number" className="form-control bg-body-highlight border-translucent" value={globalRate} onChange={e => setGlobalRate(e.target.value)} min={0} max={100} />
              <span className="input-group-text border-translucent">%</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={updateGlobalRate}>
              <span className="fas fa-save me-1"></span>Save
            </button>
          </div>
        </div>
      </div>

      {/* Per-Vendor Table */}
      <div className="card border-translucent">
        <div className="card-header bg-body-highlight border-bottom border-translucent">
          <h5 className="mb-0 text-body-emphasis"><span className="fas fa-sliders-h me-2 text-info"></span>Per-Vendor Overrides</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-7"><p className="text-body-tertiary mb-0">No vendors registered yet</p></div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Vendor</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Commission Rate</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(v => (
                    <tr key={v._id}>
                      <td className="align-middle ps-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s"><div className="avatar-name rounded-circle bg-success-subtle text-success"><span className="fs-10">{v.businessName?.charAt(0)}</span></div></div>
                          <span className="fw-semibold text-body-emphasis">{v.businessName}</span>
                        </div>
                      </td>
                      <td className="align-middle text-center"><span className={`badge badge-phoenix badge-phoenix-${statusColors[v.status] || 'secondary'} fs-10`}>{v.status}</span></td>
                      <td className="align-middle text-center">
                        {editingVendor === v._id ? (
                          <div className="d-flex gap-2 justify-content-center">
                            <div className="input-group input-group-sm" style={{ width: 100 }}>
                              <input type="number" className="form-control bg-body-highlight border-translucent text-center" value={vendorRate} onChange={e => setVendorRate(e.target.value)} min={0} max={100} />
                              <span className="input-group-text border-translucent">%</span>
                            </div>
                            <button className="btn btn-phoenix-success btn-sm px-2 py-0" onClick={() => updateVendorRate(v._id)}><span className="fas fa-check"></span></button>
                            <button className="btn btn-phoenix-secondary btn-sm px-2 py-0" onClick={() => setEditingVendor(null)}><span className="fas fa-times"></span></button>
                          </div>
                        ) : (
                          <span className="fw-bold text-body-emphasis">{v.commissionRate || globalRate}%</span>
                        )}
                      </td>
                      <td className="align-middle text-end pe-3">
                        {editingVendor !== v._id && (
                          <button className="btn btn-phoenix-primary btn-sm px-2 py-0 fs-10" onClick={() => { setEditingVendor(v._id); setVendorRate(v.commissionRate || '') }}>
                            <span className="fas fa-edit me-1"></span>Edit
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
  )
}