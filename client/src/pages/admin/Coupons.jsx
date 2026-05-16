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
    <div>
      <h4 className="mb-4">
        Coupons
        <button className="btn btn-primary btn-sm float-end" onClick={() => setShow(!show)}>
          {show ? '- Cancel' : '+ Create'}
        </button>
      </h4>

      {show && (
        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={create} className="row g-2">
              <div className="col-md-3">
                <input className="form-control" placeholder="Code" onChange={e => setForm({...form, code: e.target.value})} />
              </div>
              <div className="col-md-2">
                <input type="number" className="form-control" placeholder="Value" onChange={e => setForm({...form, discountValue: e.target.value})} />
              </div>
              <div className="col-md-3">
                <input type="date" className="form-control" onChange={e => setForm({...form, expiresAt: e.target.value})} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-success w-100">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <table className="table mb-0">
            <thead>
              <tr><th>Code</th><th>Type</th><th>Value</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c._id}>
                  <td>{c.code}</td>
                  <td>{c.discountType}</td>
                  <td>{c.discountValue}{c.discountType === 'percentage' ? '%' : 'PKR'}</td>
                  <td>{new Date(c.expiresAt).toLocaleDateString()}</td>
                  <td>{c.isActive ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}