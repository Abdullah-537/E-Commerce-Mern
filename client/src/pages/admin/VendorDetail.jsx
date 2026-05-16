import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/vendor/${id}`).then(res => setVendor(res.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>
  if (!vendor) return <div className="text-center py-5"><h4>Vendor not found</h4></div>

  return (
    <div>
      <button className="btn btn-link mb-3" onClick={() => navigate('/admin/vendors')}>&larr; Back to Vendors</button>
      <div className="row">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <img src={vendor.logo || '/assets/img/generic/avatar.png'} alt="" className="rounded-circle mb-3" style={{ width: 100, height: 100 }} />
              <h4>{vendor.businessName}</h4>
              <p className="text-muted">{vendor.userId?.email}</p>
              <p className="text-muted">{vendor.userId?.phone}</p>
              <span className={`badge ${vendor.status === 'approved' ? 'bg-success' : vendor.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>{vendor.status}</span>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5>Commission Rate: {vendor.commissionRate}%</h5>
              <p className="text-muted">{vendor.description}</p>
              <div className="row mt-3">
                <div className="col-4 text-center"><h4>{vendor.stats?.orderCount || 0}</h4><small>Orders</small></div>
                <div className="col-4 text-center"><h4>PKR {vendor.stats?.totalSales?.toLocaleString() || 0}</h4><small>Total Sales</small></div>
                <div className="col-4 text-center"><h4>{vendor.availableBalance?.toLocaleString() || 0}</h4><small>Available Balance</small></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}