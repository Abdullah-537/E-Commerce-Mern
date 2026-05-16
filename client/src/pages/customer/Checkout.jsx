import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { useSelector, useDispatch } from 'react-redux'
import { setCart } from '../../store/slices/cartSlice'

export default function Checkout() {
  const { items, totalPrice } = useSelector(state => state.cart)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', street: '', city: '', province: '', postalCode: '' })
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const shipping = 150

  useEffect(() => {
    api.get('/users/addresses').then(res => {
      setAddresses(res.data.data)
      const defaultAddr = res.data.data.find(a => a.isDefault)
      if (defaultAddr) setSelectedAddress(defaultAddr._id)
    }).catch(() => {})
  }, [])

  const addAddress = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/users/addresses', { ...newAddress, isDefault: true })
      // Refresh addresses from server to get updated defaults
      const refreshed = await api.get('/users/addresses')
      setAddresses(refreshed.data.data)
      setSelectedAddress(data.data._id)
      setShowAdd(false)
      setNewAddress({ fullName: '', phone: '', street: '', city: '', province: '', postalCode: '' })
      toast.success('Address added')
    } catch (err) { toast.error('Failed to add address') }
  }

  const placeOrder = async () => {
    if (!selectedAddress) return toast.error('Select an address')
    setLoading(true)
    try {
      const { data } = await api.post('/orders', { addressId: selectedAddress })
      navigate('/confirm-order', { state: { orderId: data.data.orderId } })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="pt-5 pb-9">
        <div className="container-small">
          <div className="text-center py-9">
            <span className="fas fa-shopping-cart fs-5 text-body-quaternary mb-4 d-block"></span>
            <h3 className="text-body-emphasis">Your cart is empty</h3>
            <p className="text-body-tertiary mb-4">Add items to your cart before checking out.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </section>
    )
  }

  const selectedAddr = addresses.find(a => a._id === selectedAddress)

  return (
    <section className="pt-5 pb-9">
      <div className="container-small">
        <nav className="mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/cart">Cart</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Checkout</li>
          </ol>
        </nav>
        <h2 className="mb-5">Check out</h2>
        <div className="row justify-content-between">
          {/* Left Column - Shipping & Payment */}
          <div className="col-lg-7 col-xl-7">
            <form onSubmit={(e) => { e.preventDefault(); placeOrder() }}>
              {/* Shipping Details */}
              <div className="d-flex align-items-end">
                <h3 className="mb-0 me-3">Shipping Details</h3>
                <button className="btn btn-link p-0" type="button" onClick={() => setShowAdd(!showAdd)}>
                  {showAdd ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              {/* Address Selection */}
              {addresses.length > 0 && (
                <div className="mt-4">
                  {addresses.map(addr => (
                    <div
                      key={addr._id}
                      className={`card mb-2 cursor-pointer ${selectedAddress === addr._id ? 'border-primary' : 'border-translucent'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedAddress(addr._id)}
                    >
                      <div className="card-body py-3">
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="address"
                            checked={selectedAddress === addr._id}
                            onChange={() => setSelectedAddress(addr._id)}
                          />
                          <label className="form-check-label">
                            <strong className="text-body-emphasis">{addr.fullName}</strong>
                            <span className="text-body-secondary ms-2">{addr.phone}</span>
                            {addr.isDefault && <span className="badge badge-phoenix badge-phoenix-primary ms-2">Default</span>}
                            <p className="mb-0 text-body-tertiary mt-1 fs-9">{addr.street}, {addr.city}, {addr.province} {addr.postalCode}</p>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show selected address details */}
              {selectedAddr && (
                <table className="table table-borderless mt-4">
                  <tbody>
                    <tr>
                      <td className="py-2 ps-0">
                        <div className="d-flex">
                          <span className="fas fa-user fs-9 me-2 text-body-tertiary"></span>
                          <h5 className="lh-sm me-4">Name</h5>
                        </div>
                      </td>
                      <td className="py-2 fw-bold lh-sm">:</td>
                      <td className="py-2 px-3">
                        <h5 className="lh-sm fw-normal text-body-secondary">{selectedAddr.fullName}</h5>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 ps-0">
                        <div className="d-flex">
                          <span className="fas fa-home fs-9 me-2 text-body-tertiary"></span>
                          <h5 className="lh-sm me-4">Address</h5>
                        </div>
                      </td>
                      <td className="py-2 fw-bold lh-sm">:</td>
                      <td className="py-2 px-3">
                        <h5 className="lh-lg fw-normal text-body-secondary">
                          {selectedAddr.street}<br />{selectedAddr.city}, {selectedAddr.province} {selectedAddr.postalCode}
                        </h5>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 ps-0">
                        <div className="d-flex">
                          <span className="fas fa-phone fs-9 me-2 text-body-tertiary"></span>
                          <h5 className="lh-sm me-4">Phone</h5>
                        </div>
                      </td>
                      <td className="py-2 fw-bold lh-sm">:</td>
                      <td className="py-2 px-3">
                        <h5 className="lh-sm fw-normal text-body-secondary">{selectedAddr.phone}</h5>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Add new address form */}
              {showAdd && (
                <div className="card mt-3 border-translucent">
                  <div className="card-body">
                    <h5 className="mb-3">New Address</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fs-8 text-body-highlight">Full Name</label>
                        <input className="form-control" placeholder="Full Name" value={newAddress.fullName}
                          onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fs-8 text-body-highlight">Phone</label>
                        <input className="form-control" placeholder="Phone" value={newAddress.phone}
                          onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fs-8 text-body-highlight">Street Address</label>
                        <input className="form-control" placeholder="Street Address" value={newAddress.street}
                          onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fs-8 text-body-highlight">City</label>
                        <input className="form-control" placeholder="City" value={newAddress.city}
                          onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fs-8 text-body-highlight">Province</label>
                        <input className="form-control" placeholder="Province" value={newAddress.province}
                          onChange={e => setNewAddress({ ...newAddress, province: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fs-8 text-body-highlight">Postal Code</label>
                        <input className="form-control" placeholder="Postal Code" value={newAddress.postalCode}
                          onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })} required />
                      </div>
                      <div className="col-12">
                        <button type="button" className="btn btn-phoenix-primary" onClick={addAddress}>Save Address</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <hr className="my-6" />

              {/* Payment Method */}
              <h3 className="mb-5">Payment Method</h3>
              <div className="row g-4 mb-7">
                <div className="col-12">
                  <div className="row gx-lg-11">
                    <div className="col-md-auto">
                      <div className="form-check">
                        <input className="form-check-input" id="cod" type="radio" name="paymentMethod" defaultChecked />
                        <label className="form-check-label fs-8 text-body" htmlFor="cod">Cash on Delivery (COD)</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="row g-2 mb-5 mb-lg-0">
                <div className="col-md-8 col-lg-9 d-grid">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Placing Order...' : `Place Order — PKR ${(totalPrice + shipping).toLocaleString()}`}
                  </button>
                </div>
                <div className="col-md-4 col-lg-3 d-grid">
                  <Link to="/cart" className="btn btn-phoenix-secondary text-nowrap">Back to Cart</Link>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Summary */}
          <div className="col-lg-5 col-xl-4">
            <div className="card mt-3 mt-lg-0">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <h3 className="mb-0">Summary</h3>
                  <Link className="btn btn-link pe-0" to="/cart">Edit cart</Link>
                </div>
                <div className="border-dashed border-bottom border-translucent mt-4">
                  <div className="ms-n2">
                    {items.map((item, i) => {
                      const itemPrice = item.productId?.salePrice || item.productId?.price || 0
                      return (
                        <div className="row align-items-center mb-2 g-3" key={i}>
                          <div className="col-8 col-md-7 col-lg-8">
                            <div className="d-flex align-items-center">
                              <img className="me-2 ms-1" src={item.productId?.images?.[0] || '/assets/img/products/60x60/1.png'} width="40" alt="" />
                              <h6 className="fw-semibold text-body-highlight lh-base line-clamp-1">
                                {item.productId?.name}
                              </h6>
                            </div>
                          </div>
                          <div className="col-2 col-md-3 col-lg-2">
                            <h6 className="fs-10 mb-0">x{item.quantity}</h6>
                          </div>
                          <div className="col-2 ps-0">
                            <h5 className="mb-0 fw-semibold text-end">PKR {(itemPrice * item.quantity).toLocaleString()}</h5>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="border-dashed border-bottom border-translucent mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <h5 className="text-body fw-semibold">Items subtotal:</h5>
                    <h5 className="text-body fw-semibold">PKR {totalPrice.toLocaleString()}</h5>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <h5 className="text-body fw-semibold">Shipping Cost</h5>
                    <h5 className="text-body fw-semibold">PKR {shipping}</h5>
                  </div>
                </div>
                <div className="d-flex justify-content-between border-dashed-y pt-3">
                  <h4 className="mb-0">Total :</h4>
                  <h4 className="mb-0">PKR {(totalPrice + shipping).toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}