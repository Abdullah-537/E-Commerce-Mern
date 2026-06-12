import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getProvinces, getCitiesByProvince } from '../../utils/pakistanCities'
import { Link } from 'react-router-dom'
import AccountSidebar from '../../components/common/AccountSidebar'

export default function Profile() {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', street: '', city: '', province: '', postalCode: '' })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    api.get('/users/addresses').then(res => setAddresses(res.data.data)).catch(() => {})
    api.get('/orders/my-orders').then(res => setOrders(res.data.data || [])).catch(() => {}).finally(() => setOrdersLoading(false))
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/users/profile', form)
      dispatch(updateUser(data.data))
      toast.success('Profile updated')
    } catch (err) { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match')
    }
    setPasswordLoading(true)
    try {
      await api.put('/users/profile/password', { 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      })
      toast.success('Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Password update failed') 
    }
    finally { setPasswordLoading(false) }
  }

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`)
      setAddresses(addresses.filter(a => a._id !== id))
      toast.success('Address deleted')
    } catch (err) { toast.error('Delete failed') }
  }

  const addAddress = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/users/addresses', { ...newAddress, isDefault: addresses.length === 0 })
      setAddresses([...addresses, data.data])
      setNewAddress({ fullName: '', phone: '', street: '', city: '', province: '', postalCode: '' })
      setShowAddAddress(false)
      toast.success('Address added')
    } catch (err) { toast.error('Failed to add address') }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <section className="pt-5 pb-9 bg-body flex-1">
      <div className="container-small">
        {/* Breadcrumb */}
        <nav className="mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Profile</li>
          </ol>
        </nav>

        {/* Two Column Layout: Sidebar + Content */}
        <div className="row g-4">
          {/* Account Sidebar */}
          <div className="col-12 col-lg-3">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="col-12 col-lg-9">

        {/* Profile Header Card */}
        <div className="card mb-5">
          <div className="card-body">
            <div className="row align-items-center g-4">
              <div className="col-auto">
                <div className="position-relative" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload').click()}>
                  <div className="avatar avatar-5xl">
                    {user?.avatar ? (
                      <img className="rounded-circle" src={user.avatar} alt="" style={{ width: 120, height: 120, objectFit: 'cover' }} />
                    ) : (
                      <div className="avatar-name rounded-circle" style={{ width: 120, height: 120, fontSize: '3rem' }}><span>{initial}</span></div>
                    )}
                  </div>
                  <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    <span className="fas fa-camera text-white fs-10"></span>
                  </div>
                  <input
                    type="file"
                    id="avatar-upload"
                    className="d-none"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Image must be under 2MB')
                        return
                      }
                      const reader = new FileReader()
                      reader.onloadend = async () => {
                        try {
                          const { data } = await api.put('/users/profile', { avatar: reader.result })
                          dispatch(updateUser(data.data))
                          toast.success('Profile picture updated')
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
                <h3 className="mb-1 text-body-emphasis">{user?.name || 'User'}</h3>
                <p className="text-body-tertiary mb-1">
                  <span className="fas fa-envelope me-2 fs-10"></span>{user?.email}
                </p>
                {user?.phone && (
                  <p className="text-body-tertiary mb-1">
                    <span className="fas fa-phone me-2 fs-10"></span>{user.phone}
                  </p>
                )}
                <div className="d-flex gap-2 mt-2 flex-wrap">
                  <span className={`badge rounded-pill px-3 py-2 fs-10 fw-bold ${
                    user?.role === 'admin' ? 'bg-danger-subtle text-danger' : 
                    user?.role === 'vendor' ? 'bg-success-subtle text-success' : 
                    'bg-primary-subtle text-primary'
                  }`}>
                    <span className={`fas ${user?.role === 'admin' ? 'fa-shield-halved' : user?.role === 'vendor' ? 'fa-store' : 'fa-user'} me-1`}></span>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                  {user?.isVerified && (
                    <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 fs-10 fw-bold">
                      <span className="fas fa-check-circle me-1"></span>Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-5">
          {/* Left Column — Profile Settings */}
          <div className="col-12 col-lg-7">
            {/* Personal Information */}
            <div className="card mb-5">
              <div className="card-header bg-body-highlight">
                <h4 className="mb-0">
                  <span className="fas fa-user-edit me-2 text-primary"></span>Personal Information
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpdate}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Full Name</label>
                      <input
                        className="form-control"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Phone Number</label>
                      <input
                        className="form-control"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 3XX XXXXXXX"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Email Address</label>
                      <input className="form-control bg-body-highlight" value={user?.email} disabled />
                      <div className="form-text fs-10 text-body-quaternary">Email cannot be changed</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                      ) : (
                        <>Save Changes</>
                      )}
                    </button>
                    <button type="button" className="btn btn-phoenix-secondary" onClick={() => setForm({ name: user?.name || '', phone: user?.phone || '' })}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Change Password */}
            <div className="card mb-5">
              <div className="card-header bg-body-highlight">
                <h4 className="mb-0">
                  <span className="fas fa-key me-2 text-primary"></span>Change Password
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordUpdate}>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength="6"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-8 text-body-highlight ps-0 text-transform-none">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        minLength="6"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                      {passwordLoading ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>Updating...</>
                      ) : (
                        <>Update Password</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column — Addresses */}
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header bg-body-highlight d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <span className="fas fa-map-marker-alt me-2 text-primary"></span>My Addresses
                </h4>
                <button className="btn btn-sm btn-phoenix-primary" onClick={() => setShowAddAddress(!showAddAddress)}>
                  {showAddAddress ? 'Cancel' : '+ Add New'}
                </button>
              </div>
              <div className="card-body">
                {/* Add Address Form */}
                {showAddAddress && (
                  <form onSubmit={addAddress} className="mb-4 p-3 border border-translucent rounded-3 bg-body-highlight">
                    <h6 className="mb-3 text-body-emphasis">New Address</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <input className="form-control form-control-sm" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} required />
                      </div>
                      <div className="col-6">
                        <input className="form-control form-control-sm" placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} required />
                      </div>
                    </div>
                    <input className="form-control form-control-sm mb-2" placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required />
                    <div className="row g-2 mb-2">
                      <div className="col-sm-6">
                        <select className="form-select form-select-sm" value={newAddress.province} onChange={e => setNewAddress({...newAddress, province: e.target.value, city: ''})} required>
                          <option value="">Province</option>
                          {getProvinces().map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="col-sm-6">
                        <select className="form-select form-select-sm" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required disabled={!newAddress.province}>
                          <option value="">City</option>
                          {getCitiesByProvince(newAddress.province).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-12">
                        <input className="form-control form-control-sm" placeholder="Postal Code" value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} required />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary">Save Address</button>
                  </form>
                )}

                {/* Address List */}
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="fas fa-map-marker-alt fs-5 text-body-quaternary d-block mb-2"></span>
                    <p className="text-body-tertiary mb-0">No saved addresses</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {addresses.map(addr => (
                      <div key={addr._id} className="border border-translucent rounded-3 p-3 position-relative">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="mb-0 text-body-emphasis">
                            <span className="fas fa-map-pin me-1 text-body-quaternary fs-10"></span>
                            {addr.fullName}
                          </h6>
                          <div className="d-flex gap-1 align-items-center">
                            {addr.isDefault && (
                              <span className="badge badge-phoenix badge-phoenix-primary fs-11">Default</span>
                            )}
                            <button className="btn btn-sm p-0 text-body-quaternary" onClick={() => deleteAddress(addr._id)} title="Delete">
                              <span className="fas fa-trash-alt fs-10"></span>
                            </button>
                          </div>
                        </div>
                        <p className="text-body-tertiary fs-9 mb-1">{addr.street}</p>
                        <p className="text-body-tertiary fs-9 mb-1">{addr.city}, {addr.province} {addr.postalCode}</p>
                        {addr.phone && (
                          <p className="text-body-quaternary fs-10 mb-0">
                            <span className="fas fa-phone-alt me-1"></span>{addr.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
          
          {/* Full Width — Recent Orders */}
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-body-highlight d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <span className="fas fa-shopping-bag me-2 text-primary"></span>Recent Orders
                </h4>
                <Link to="/orders" className="btn btn-sm btn-phoenix-primary">View All</Link>
              </div>
              <div className="card-body p-0">
                {ordersLoading ? (
                  <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                ) : orders.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 fs-9" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th className="text-body-tertiary ps-4">Order</th>
                          <th className="text-body-tertiary">Date</th>
                          <th className="text-body-tertiary">Status</th>
                          <th className="text-body-tertiary text-end pe-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order._id}>
                            <td className="ps-4">
                              <span className="fw-semibold text-body-emphasis">#{order._id?.slice(-6).toUpperCase()}</span>
                            </td>
                            <td className="text-body-tertiary">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge badge-phoenix badge-phoenix-${
                                order.status === 'delivered' ? 'success' :
                                order.status === 'shipped' ? 'info' :
                                order.status === 'processing' ? 'warning' :
                                order.status === 'cancelled' ? 'danger' : 'secondary'
                              } fs-10`}>{order.status}</span>
                            </td>
                            <td className="text-end fw-semibold text-body-emphasis pe-4">PKR {order.totalAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <span className="fas fa-box-open fs-5 text-body-quaternary d-block mb-2"></span>
                    <p className="text-body-tertiary mb-0">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div> {/* close col-lg-9 */}
        </div> {/* close row */}

      </div>
    </section>
  )
}
