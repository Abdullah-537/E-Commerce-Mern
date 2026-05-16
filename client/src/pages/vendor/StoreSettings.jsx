import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function StoreSettings() {
  const [form, setForm] = useState({ returnPolicy: '', shippingPolicy: '', isOpen: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vendor/profile')
      setForm({
        returnPolicy: res.data.data?.returnPolicy || 'Returns accepted within 30 days of delivery.',
        shippingPolicy: res.data.data?.shippingPolicy || 'Standard delivery 3-5 business days.',
        isOpen: res.data.data?.isOpen !== false
      })
    } catch (e) { toast.error('Failed to load settings') }
    setLoading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile', form)
      toast.success('Settings saved')
    } catch (e) { toast.error('Failed to save') }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>

  return (
    <div>
      <h4 className="mb-4">Store Settings</h4>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={save}>
            <div className="mb-4">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="isOpen" checked={form.isOpen} onChange={e => setForm({ ...form, isOpen: e.target.checked })} />
                <label className="form-check-label" htmlFor="isOpen">
                  <strong>Store Open</strong>
                  <p className="text-muted small mb-0">Customers can see and purchase from your store</p>
                </label>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Return Policy</label>
              <textarea className="form-control" rows={3} value={form.returnPolicy} onChange={e => setForm({ ...form, returnPolicy: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Shipping Policy</label>
              <textarea className="form-control" rows={3} value={form.shippingPolicy} onChange={e => setForm({ ...form, shippingPolicy: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}