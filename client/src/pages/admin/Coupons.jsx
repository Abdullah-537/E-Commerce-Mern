import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 10, minOrderAmount: 0, expiresAt: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/coupons')
      .then(res => setCoupons(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const create = async (e) => {
    e.preventDefault()
    try {
      await api.post('/coupons', form)
      setShow(false)
      const { data } = await api.get('/coupons')
      setCoupons(data.data)
      toast.success('Created')
    } catch (e) {
      toast.error('Failed')
    }
  }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="text-body-emphasis fw-bold mb-1">Promo Coupons</h3>
          <p className="text-muted fs-9 mb-0">Create and manage discount codes available across the marketplace.</p>
        </div>
        <div>
          <button 
            className={`btn btn-${show ? 'phoenix-secondary' : 'primary'} fw-bold rounded-pill`} 
            onClick={() => setShow(!show)}
          >
            <span className={`fas fa-${show ? 'times' : 'plus'} me-2`}></span>
            {show ? 'Cancel' : 'Create Coupon'}
          </button>
        </div>
      </div>

      {/* Create Form Card */}
      {show && (
        <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white border-bottom border-translucent py-3">
            <h5 className="mb-0 text-body-emphasis fw-bold">
              <span className="fas fa-plus-circle me-2 text-primary"></span>New Coupon Configuration
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={create} className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label text-muted fw-bold fs-10 uppercase">Coupon Code</label>
                <input 
                  type="text"
                  className="form-control bg-body-highlight border-translucent" 
                  placeholder="e.g. SHOP20" 
                  required
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted fw-bold fs-10 uppercase">Discount Value</label>
                <div className="input-group">
                  <input 
                    type="number" 
                    className="form-control bg-body-highlight border-translucent" 
                    placeholder="e.g. 10" 
                    min={1}
                    required
                    onChange={e => setForm({...form, discountValue: Number(e.target.value)})} 
                  />
                  <span className="input-group-text bg-light border-translucent">%</span>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted fw-bold fs-10 uppercase">Expiry Date</label>
                <input 
                  type="date" 
                  className="form-control bg-body-highlight border-translucent" 
                  required
                  onChange={e => setForm({...form, expiresAt: e.target.value})} 
                />
              </div>
              <div className="col-12 col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-success w-100 fw-bold">
                  <span className="fas fa-check me-2"></span>Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-ticket-alt fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold mb-0">No coupons active yet</h5>
              <p className="text-muted fs-10 mb-0">Click the button above to generate a new coupon.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Coupon Code</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Discount Type</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Discount Value</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Expiry Date</th>
                    <th className="pe-4 py-3 text-center" style={{ width: '130px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c._id}>
                      <td className="ps-4 fw-bold text-body-emphasis">
                        <span className="badge badge-phoenix badge-phoenix-primary px-3 py-2 fs-9">
                          {c.code}
                        </span>
                      </td>
                      <td className="fw-semibold text-body-tertiary text-capitalize">{c.discountType}</td>
                      <td className="fw-bold text-body-emphasis">
                        {c.discountValue}{c.discountType === 'percentage' ? '%' : ' PKR'}
                      </td>
                      <td className="text-muted">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="text-center pe-4">
                        <span className={`badge badge-phoenix badge-phoenix-${c.isActive ? 'success' : 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          {c.isActive ? 'Active' : 'Expired'}
                        </span>
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