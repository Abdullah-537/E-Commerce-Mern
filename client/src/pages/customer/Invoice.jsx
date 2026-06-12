import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

export default function Invoice() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const print = () => window.print()

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
  if (!order) return <div className="text-center py-5"><h4>Order not found</h4></div>

  return (
    <div className="container-small py-5">
      <nav className="mb-4 no-print" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/orders">My Orders</Link></li>
          <li className="breadcrumb-item active">Invoice #{order._id.substring(order._id.length - 8).toUpperCase()}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2 className="mb-0 text-body-emphasis">Invoice</h2>
        <div className="d-flex gap-2">
          <Link to={`/orders/${id}/track`} className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-arrow-left me-2"></span>Back to Order
          </Link>
          <button className="btn btn-primary btn-sm" onClick={print}>
            <span className="fas fa-print me-2"></span>Print
          </button>
        </div>
      </div>

      <div className="card border border-translucent shadow-sm print-card" id="invoice">
        <div className="card-body p-4 p-xl-5">
          {/* Invoice Header */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom border-translucent pb-4 mb-4">
            <div className="mb-3 mb-sm-0">
              <div className="d-flex align-items-center mb-2">
                <img src="/assets/img/icons/logo.png" alt="ShopZone" width="32" className="me-2" />
                <h3 className="mb-0 text-body-emphasis fw-bolder tracking-tight">ShopZone</h3>
              </div>
              <p className="text-body-tertiary mb-0 fs-9">Premium Multi-Vendor Marketplace</p>
            </div>
            <div className="text-sm-end">
              <h2 className="text-body-quaternary mb-1 text-uppercase fw-bold letter-spacing-1">Invoice</h2>
              <p className="text-body-emphasis fw-semibold mb-0">#{order._id.substring(order._id.length - 8).toUpperCase()}</p>
              <p className="text-body-tertiary fs-9 mb-0">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billing & Shipping Info */}
          <div className="row g-4 mb-5">
            <div className="col-sm-6">
              <h6 className="text-body-quaternary text-uppercase fw-bold mb-3 fs-10">Billed To / Shipped To</h6>
              <h5 className="text-body-emphasis mb-1">{order.addressId?.fullName || 'Customer'}</h5>
              <p className="text-body-tertiary fs-9 mb-0">{order.addressId?.street}</p>
              <p className="text-body-tertiary fs-9 mb-0">{order.addressId?.city}, {order.addressId?.province} {order.addressId?.postalCode}</p>
              {order.addressId?.phone && (
                <p className="text-body-tertiary fs-9 mb-0 mt-1">
                  <span className="fas fa-phone-alt me-2 text-body-quaternary"></span>{order.addressId.phone}
                </p>
              )}
            </div>
            <div className="col-sm-6 text-sm-end">
              <h6 className="text-body-quaternary text-uppercase fw-bold mb-3 fs-10">Payment Details</h6>
              <p className="text-body-emphasis fs-9 fw-semibold mb-1 text-uppercase">
                Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
              </p>
              <p className="text-body-tertiary fs-9 mb-1">
                Status: <span className={`badge badge-phoenix fs-10 ms-1 ${order.paymentStatus === 'paid' ? 'badge-phoenix-success' : 'badge-phoenix-warning'}`}>{order.paymentStatus}</span>
              </p>
              <p className="text-body-tertiary fs-9 mb-0">
                Order Status: <span className={`badge badge-phoenix fs-10 ms-1 ${order.status === 'delivered' ? 'badge-phoenix-success' : order.status === 'cancelled' ? 'badge-phoenix-danger' : 'badge-phoenix-info'}`}>{order.status}</span>
              </p>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="table-responsive mb-4">
            <table className="table table-borderless fs-9 mb-0">
              <thead className="bg-body-highlight">
                <tr className="border-bottom border-translucent text-body-tertiary">
                  <th className="ps-3 py-3 text-uppercase fw-bold fs-10">Item Description</th>
                  <th className="py-3 text-center text-uppercase fw-bold fs-10">Qty</th>
                  <th className="py-3 text-end text-uppercase fw-bold fs-10">Unit Price</th>
                  <th className="pe-3 py-3 text-end text-uppercase fw-bold fs-10">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, i) => (
                  <tr key={i} className="border-bottom border-translucent">
                    <td className="ps-3 py-3">
                      <p className="text-body-emphasis fw-semibold mb-0">{item.productName}</p>
                      <p className="text-body-quaternary fs-10 mb-0">Sold by: Vendor</p>
                    </td>
                    <td className="py-3 text-center align-middle fw-semibold text-body-emphasis">{item.quantity}</td>
                    <td className="py-3 text-end align-middle text-body-tertiary">PKR {item.price?.toLocaleString()}</td>
                    <td className="pe-3 py-3 text-end align-middle fw-bold text-body-emphasis">PKR {(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="row justify-content-end mb-4">
            <div className="col-12 col-md-5 col-lg-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-body-tertiary fs-9 fw-semibold">Subtotal</span>
                <span className="text-body-emphasis fs-9 fw-semibold">PKR {order.subtotal?.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-body-tertiary fs-9 fw-semibold">Discount</span>
                  <span className="text-success fs-9 fw-semibold">-PKR {order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-3">
                <span className="text-body-tertiary fs-9 fw-semibold">Shipping</span>
                <span className="text-body-emphasis fs-9 fw-semibold">PKR {order.shippingFee?.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between bg-body-highlight p-3 rounded-3 border border-translucent">
                <span className="text-body-emphasis fw-bold mb-0">Total</span>
                <span className="text-primary fw-bolder fs-7 mb-0">PKR {order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-6 pt-4 border-top border-translucent">
            <h6 className="text-body-tertiary mb-1">Thank you for your purchase!</h6>
            <p className="text-body-quaternary fs-10 mb-0">If you have any questions about this invoice, please contact support@shopzone.pk</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          body { background: white !important; padding: 0 !important; } 
          .print-card { box-shadow: none !important; border: none !important; }
          .container-small { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
