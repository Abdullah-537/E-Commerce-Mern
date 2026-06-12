import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

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
    <div className="pb-5">
      {/* Back Button */}
      <div className="mb-4">
        <button className="btn btn-phoenix-secondary btn-sm rounded-pill mb-3" onClick={() => navigate('/admin/vendors')}>
          <span className="fas fa-arrow-left me-2"></span>Back to Store Directory
        </button>
        <div className="d-flex align-items-center gap-3">
          <h3 className="text-body-emphasis fw-bold mb-0">Store Details</h3>
          <span className={`badge badge-phoenix badge-phoenix-${vendor.status === 'approved' ? 'success' : vendor.status === 'pending' ? 'warning' : 'danger'} px-3 py-2 fw-bold fs-9`}>
            {vendor.status}
          </span>
        </div>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-lg-4">
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 position-relative d-inline-block">
                {vendor.logo ? (
                  <img 
                    src={vendor.logo} 
                    alt="" 
                    className="rounded-circle border border-2 border-primary p-1 shadow-sm" 
                    style={{ width: 110, height: 110, objectFit: 'cover' }} 
                  />
                ) : (
                  <div className={`rounded-circle border border-2 border-primary p-1 shadow-sm d-flex align-items-center justify-content-center bg-${getAvatarColor(vendor.businessName)}-subtle text-${getAvatarColor(vendor.businessName)} fw-bold`} style={{ width: 110, height: 110, fontSize: '2.5rem' }}>
                    {vendor.businessName?.charAt(0).toUpperCase() || 'V'}
                  </div>
                )}
              </div>
              <h4 className="fw-bold text-body-emphasis mb-1">{vendor.businessName}</h4>
              <p className="text-muted fs-9 mb-3">{vendor.description || 'No store bio or description provided yet.'}</p>
              
              <hr className="my-3 border-translucent" />

              <div className="text-start">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="fas fa-envelope text-muted" style={{ width: '16px' }}></span>
                  <span className="text-body-highlight fs-9">{vendor.userId?.email || 'N/A'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fas fa-phone text-muted" style={{ width: '16px' }}></span>
                  <span className="text-body-highlight fs-9">{vendor.userId?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Performance Card */}
        <div className="col-12 col-lg-8">
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-chart-line me-2 text-primary"></span>Performance Overview
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 text-center mb-4">
                <div className="col-4">
                  <div className="p-3 bg-light rounded-3">
                    <h3 className="fw-bold text-primary mb-0">{vendor.stats?.orderCount || 0}</h3>
                    <small className="text-muted fw-bold fs-10 uppercase">Total Orders</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-light rounded-3">
                    <h3 className="fw-bold text-success mb-0">PKR {vendor.stats?.totalSales?.toLocaleString() || 0}</h3>
                    <small className="text-muted fw-bold fs-10 uppercase">Gross Volume</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-light rounded-3">
                    <h3 className="fw-bold text-warning mb-0">PKR {vendor.availableBalance?.toLocaleString() || 0}</h3>
                    <small className="text-muted fw-bold fs-10 uppercase">Available Cash</small>
                  </div>
                </div>
              </div>

              <h5 className="text-body-emphasis fw-bold mb-3">Contract Settings</h5>
              <div className="p-3 border border-translucent rounded-3 bg-body-highlight">
                <div className="row">
                  <div className="col-6">
                    <span className="text-muted d-block fs-10 uppercase fw-bold">Active Commission Rate</span>
                    <span className="fw-bold text-body-emphasis fs-8">{vendor.commissionRate}% commission per sale</span>
                  </div>
                  <div className="col-6 text-end d-flex align-items-center justify-content-end">
                    <button className="btn btn-phoenix-primary btn-sm fw-bold rounded-pill" onClick={() => navigate('/admin/commission-settings')}>
                      <span className="fas fa-cog me-1"></span>Edit Contract
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}