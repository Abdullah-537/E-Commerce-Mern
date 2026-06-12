import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getProvinces, getCitiesByProvince } from '../../utils/pakistanCities'

export default function ShippingInfo() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: 'Home', fullName: '', phone: '', street: '', city: '', province: '', postalCode: '', isDefault: false })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchAddresses() }, [])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/addresses')
      setAddresses(res.data.data || [])
    } catch (e) { toast.error('Failed to load addresses') }
    setLoading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form)
        toast.success('Address updated')
      } else {
        await api.post('/users/addresses', form)
        toast.success('Address added')
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', province: '', postalCode: '', isDefault: false })
      fetchAddresses()
    } catch (e) { toast.error('Failed to save') }
  }

  const edit = (addr) => {
    setForm(addr)
    setEditingId(addr._id)
    setShowForm(true)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await api.delete(`/users/addresses/${id}`)
      toast.success('Address deleted')
      fetchAddresses()
    } catch (e) { toast.error('Failed to delete') }
  }

  const setDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}`, { isDefault: true })
      fetchAddresses()
    } catch (e) { toast.error('Failed') }
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Shipping Addresses</h4>
        <Link to="/profile" className="btn btn-outline-secondary">← Back to Profile</Link>
      </div>
      {!showForm && <button className="btn btn-primary mb-4" onClick={() => setShowForm(true)}>+ Add New Address</button>}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-3">{editingId ? 'Edit' : 'Add'} Address</h5>
            <form onSubmit={save}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Label</label>
                  <select className="form-select" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}>
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone *</label>
                  <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Province *</label>
                  <select className="form-select" value={form.province} onChange={e => setForm({ ...form, province: e.target.value, city: '' })} required>
                    <option value="">Select Province</option>
                    {getProvinces().map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">City *</label>
                  <select className="form-select" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required disabled={!form.province}>
                    <option value="">Select City</option>
                    {getCitiesByProvince(form.province).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Postal Code *</label>
                  <input type="text" className="form-control" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Street Address *</label>
                  <textarea className="form-control" rows={2} value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                    <label className="form-check-label" htmlFor="isDefault">Set as default address</label>
                  </div>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-success me-2">Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', province: '', postalCode: '', isDefault: false }) }}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-5"><div className="spinner-border"></div></div> : (
        <div className="row g-4">
          {addresses.length === 0 && !showForm ? <div className="col-12"><p className="text-muted text-center">No addresses saved</p></div> : addresses.map(addr => (
            <div className="col-md-6" key={addr._id}>
              <div className={`card border-0 shadow-sm h-100 ${addr.isDefault ? 'border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary">{addr.label}</span>
                    {addr.isDefault && <span className="badge bg-success">Default</span>}
                  </div>
                  <p className="mb-1"><strong>{addr.fullName}</strong></p>
                  <p className="mb-1 text-muted">{addr.phone}</p>
                  <p className="mb-3 text-muted">{addr.street}, {addr.city}, {addr.province} {addr.postalCode}</p>
                  <div>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => edit(addr)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger me-1" onClick={() => remove(addr._id)}>Delete</button>
                    {!addr.isDefault && <button className="btn btn-sm btn-outline-secondary" onClick={() => setDefault(addr._id)}>Set Default</button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
