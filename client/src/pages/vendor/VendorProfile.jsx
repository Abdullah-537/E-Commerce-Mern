import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

export default function VendorProfile() {
  const { user } = useSelector(state => state.auth)
  const [vendor, setVendor] = useState(null)
  const [form, setForm] = useState({
    businessName: '', description: '', businessEmail: '', businessPhone: '',
    returnPolicy: '', shippingPolicy: '', isOpen: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    api.get('/vendor/profile').then(res => {
      const v = res.data.data
      setVendor(v)
      setForm({
        businessName: v.businessName || '',
        description: v.description || '',
        businessEmail: v.businessEmail || '',
        businessPhone: v.businessPhone || '',
        returnPolicy: v.returnPolicy || '',
        shippingPolicy: v.shippingPolicy || '',
        isOpen: v.isOpen !== false
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/vendor/profile', form)
      dispatch(updateUser({ vendor: data.data }))
      toast.success('Profile updated')
    } catch (e) { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const avatarSrc = user?.avatar || vendor?.logo
  const getInitial = () => (vendor?.businessName || user?.name || 'V').charAt(0).toUpperCase()

  const renderAvatar = (size = 100) => {
    if (avatarSrc) {
      return <img className="rounded-circle overflow-hidden" src={avatarSrc} alt="" style={{ width: size, height: size, objectFit: 'cover' }} />
    }
    return (
      <div className={`rounded-circle bg-${getAvatarColor(vendor?.businessName || user?.name)}-subtle text-${getAvatarColor(vendor?.businessName || user?.name)} d-flex align-items-center justify-content-center fw-bold overflow-hidden`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {getInitial()}
      </div>
    )
  }

  if (loading) return (
    <div className="text-center py-9">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  )

  return (
    <div>
      {/* Profile Header */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="row align-items-center g-4">
            <div className="col-auto">
              <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('vendor-avatar-upload').click()}>
                <div>
                  {renderAvatar(100)}
                </div>
                <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                  <span className="fas fa-camera text-white fs-10"></span>
                </div>
                <input
                  type="file"
                  id="vendor-avatar-upload"
                  className="d-none"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')
                    const reader = new FileReader()
                    reader.onloadend = async () => {
                      try {
                        const { data } = await api.put('/vendor/profile', { logo: reader.result })
                        setVendor(data.data)
                        // Also update Redux if needed to keep the top nav in sync, but top nav uses user.avatar
                        // We will also update user.avatar just to keep them identical if that's what they expect
                        await api.put('/users/profile', { avatar: reader.result }).then(res => dispatch(updateUser(res.data.data)))
                        toast.success('Store picture updated')
                      } catch (err) {
                        toast.error('Failed to update picture')
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </div>
            </div>
            <div className="col">
              <h3 className="mb-1 text-body-emphasis">{vendor?.businessName || 'Your Store'}</h3>
              <p className="text-body-tertiary mb-1 fs-9">
                <span className="fas fa-envelope me-1"></span>{vendor?.businessEmail}
              </p>
              {vendor?.businessPhone && (
                <p className="text-body-tertiary mb-0 fs-9">
                  <span className="fas fa-phone me-1"></span>{vendor.businessPhone}
                </p>
              )}
              <div className="d-flex gap-2 mt-2">
                <span className={`badge badge-phoenix badge-phoenix-${vendor?.status === 'approved' ? 'success' : vendor?.status === 'pending' ? 'warning' : 'danger'} fs-10`}>
                  {vendor?.status}
                </span>
                <span className={`badge badge-phoenix badge-phoenix-${form.isOpen ? 'success' : 'secondary'} fs-10`}>
                  <span className={`fas fa-${form.isOpen ? 'door-open' : 'door-closed'} me-1`}></span>
                  {form.isOpen ? 'Store Open' : 'Store Closed'}
                </span>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex flex-column gap-2 text-end">
                <div>
                  <p className="text-body-tertiary mb-0 fs-10">Total Earnings</p>
                  <h4 className="text-body-emphasis mb-0">PKR {(vendor?.totalEarnings || 0).toLocaleString()}</h4>
                </div>
                <div>
                  <p className="text-body-tertiary mb-0 fs-10">Available Balance</p>
                  <h4 className="text-success mb-0">PKR {(vendor?.availableBalance || 0).toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="row g-5">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header bg-body-highlight border-bottom border-translucent">
              <h4 className="mb-0">
                <span className="fas fa-store me-2 text-primary"></span>Store Information
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Business Name</label>
                    <input className="form-control" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Business Email</label>
                    <input className="form-control" type="email" value={form.businessEmail} onChange={e => setForm({...form, businessEmail: e.target.value})} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Business Phone</label>
                    <input className="form-control" value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Store Status</label>
                    <div className="form-check form-switch mt-2">
                      <input className="form-check-input" type="checkbox" id="storeStatus" checked={form.isOpen} onChange={e => setForm({...form, isOpen: e.target.checked})} />
                      <label className="form-check-label text-body-emphasis" htmlFor="storeStatus">
                        {form.isOpen ? 'Store is Open' : 'Store is Closed'}
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Store Description</label>
                    <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell customers about your store..."></textarea>
                  </div>
                </div>

                <hr className="my-4 border-translucent" />

                <h5 className="mb-3 text-body-emphasis">
                  <span className="fas fa-shield-alt me-2 text-primary"></span>Policies
                </h5>
                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Return Policy</label>
                    <textarea className="form-control" rows="2" value={form.returnPolicy} onChange={e => setForm({...form, returnPolicy: e.target.value})} placeholder="e.g., 7-day return policy..."></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Shipping Policy</label>
                    <textarea className="form-control" rows="2" value={form.shippingPolicy} onChange={e => setForm({...form, shippingPolicy: e.target.value})} placeholder="e.g., Free shipping on orders over PKR 2000..."></textarea>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</> : <>Save Changes</>}
                  </button>
                  <button type="button" className="btn btn-phoenix-secondary" onClick={() => window.location.reload()}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column — Store Stats */}
        <div className="col-12 col-lg-4">
          <div className="card mb-4">
            <div className="card-header bg-body-highlight border-bottom border-translucent">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-info-circle me-2 text-primary"></span>Store Details
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-body-tertiary fs-9">Status</span>
                  <span className={`badge badge-phoenix badge-phoenix-${vendor?.status === 'approved' ? 'success' : 'warning'}`}>{vendor?.status}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-body-tertiary fs-9">Commission Rate</span>
                  <span className="text-body-emphasis fw-semibold fs-9">{vendor?.commissionRate || 10}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-body-tertiary fs-9">Member Since</span>
                  <span className="text-body-emphasis fw-semibold fs-9">{vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-body-tertiary fs-9">Avg Rating</span>
                  <span className="text-body-emphasis fw-semibold fs-9">
                    <span className="fas fa-star text-warning me-1"></span>{vendor?.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Info Card */}
          {vendor?.bankDetails && (
            <div className="card">
              <div className="card-header bg-body-highlight border-bottom border-translucent">
                <h5 className="mb-0 text-body-emphasis">
                  <span className="fas fa-university me-2 text-primary"></span>Bank Information
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-2">
                  <div>
                    <p className="text-body-tertiary fs-10 mb-0">Bank Name</p>
                    <p className="text-body-emphasis fw-semibold fs-9 mb-0">{vendor.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-body-tertiary fs-10 mb-0">Account Title</p>
                    <p className="text-body-emphasis fw-semibold fs-9 mb-0">{vendor.bankDetails.accountTitle}</p>
                  </div>
                  <div>
                    <p className="text-body-tertiary fs-10 mb-0">Account Number</p>
                    <p className="text-body-emphasis fw-semibold fs-9 mb-0">••••{vendor.bankDetails.accountNumber?.slice(-4)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
