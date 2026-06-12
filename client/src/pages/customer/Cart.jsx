import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { setCart } from '../../store/slices/cartSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Cart() {
  const { items, totalPrice, totalItems } = useSelector(state => state.cart)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    api.get('/cart').then(res => dispatch(setCart(res.data.data))).catch(() => {})
  }, [dispatch])

  const updateQty = async (productId, qty) => {
    if (qty < 1) return
    try {
      const { data } = await api.patch(`/cart/${productId}`, { quantity: qty })
      dispatch(setCart(data.data))
    } catch (err) { toast.error('Update failed') }
  }

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`)
      dispatch(setCart(data.data))
    } catch (err) { toast.error('Remove failed') }
  }

  const applyCoupon = async () => {
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal: totalPrice })
      setDiscount(data.data.discount)
      toast.success('Coupon applied')
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid coupon') }
  }

  const proceedCheckout = () => navigate('/checkout')

  const shipping = 150

  if (items.length === 0) {
    return (
      <section className="pt-5 pb-9 bg-body flex-1">
        <div className="container-small cart">
          <div className="text-center py-9">
            <span className="fas fa-shopping-cart fs-5 text-body-quaternary mb-4 d-block"></span>
            <h3 className="text-body-emphasis">Your cart is empty</h3>
            <p className="text-body-tertiary mb-4">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" className="btn btn-primary">
              Continue Shopping<span className="fas fa-chevron-right ms-1 fs-10"></span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-5 pb-9 bg-body flex-1">
      <div className="container-small cart">
        <nav className="mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Cart</li>
          </ol>
        </nav>
        <h2 className="mb-6">Cart</h2>
        <div className="row g-5">
          {/* Cart Table */}
          <div className="col-12 col-lg-8">
            <div className="table-responsive scrollbar mx-n1 px-1">
              <table className="table fs-9 mb-0 border-top border-translucent">
                <thead>
                  <tr>
                    <th className="sort white-space-nowrap align-middle fs-10" scope="col"></th>
                    <th className="sort white-space-nowrap align-middle" scope="col" style={{ minWidth: 250 }}>PRODUCTS</th>
                    <th className="sort align-middle text-end" scope="col" style={{ width: 300 }}>PRICE</th>
                    <th className="sort align-middle ps-5" scope="col" style={{ width: 200 }}>QUANTITY</th>
                    <th className="sort align-middle text-end" scope="col" style={{ width: 250 }}>TOTAL</th>
                    <th className="sort text-end align-middle pe-0" scope="col"></th>
                  </tr>
                </thead>
                <tbody className="list" id="cart-table-body">
                  {items.map((item, i) => {
                    const price = item.productId?.salePrice || item.productId?.price || 0
                    const itemTotal = price * item.quantity
                    return (
                      <tr className="cart-table-row" key={i}>
                        <td className="align-middle white-space-nowrap py-0">
                          <Link className="d-block border border-translucent rounded-2" to={`/product/${item.productId?._id}`}>
                            <img src={item.productId?.images?.[0] || '/assets/img/products/60x60/1.png'} alt="" width="53" />
                          </Link>
                        </td>
                        <td className="products align-middle">
                          <Link className="fw-semibold mb-0 line-clamp-2" to={`/product/${item.productId?._id}`}>
                            {item.productId?.name}
                          </Link>
                        </td>
                        <td className="price align-middle text-body fs-9 fw-semibold text-end">
                          PKR {price.toLocaleString()}
                        </td>
                        <td className="quantity align-middle fs-8 ps-5">
                          <div className="input-group input-group-sm flex-nowrap">
                            <button className="btn btn-sm px-2" onClick={() => updateQty(item.productId._id, item.quantity - 1)}>-</button>
                            <input
                              className="form-control text-center input-spin-none bg-transparent border-0 px-0"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQty(item.productId._id, parseInt(e.target.value) || 1)}
                              aria-label="Quantity"
                            />
                            <button className="btn btn-sm px-2" onClick={() => updateQty(item.productId._id, item.quantity + 1)}>+</button>
                          </div>
                        </td>
                        <td className="total align-middle fw-bold text-body-highlight text-end">
                          PKR {itemTotal.toLocaleString()}
                        </td>
                        <td className="align-middle white-space-nowrap text-end pe-0 ps-3">
                          <button
                            className="btn btn-sm text-body-tertiary text-opacity-85 text-body-tertiary-hover me-2"
                            onClick={() => removeItem(item.productId._id)}
                          >
                            <span className="fas fa-trash"></span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Subtotal row */}
                  <tr>
                    <td className="text-body-emphasis fw-semibold ps-0 fs-8" colSpan="4">
                      Items subtotal :
                    </td>
                    <td className="text-body-emphasis fw-bold text-end fs-8">
                      PKR {totalPrice.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-between-center mb-3">
                  <h3 className="card-title mb-0">Summary</h3>
                </div>
                <select className="form-select mb-3" aria-label="delivery type">
                  <option value="cod">Cash on Delivery</option>
                  <option value="card">Card</option>
                  <option value="paypal">Paypal</option>
                </select>
                <div>
                  <div className="d-flex justify-content-between">
                    <p className="text-body fw-semibold">Items subtotal :</p>
                    <p className="text-body-emphasis fw-semibold">PKR {totalPrice.toLocaleString()}</p>
                  </div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between">
                      <p className="text-body fw-semibold">Discount :</p>
                      <p className="text-danger fw-semibold">-PKR {discount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="d-flex justify-content-between">
                    <p className="text-body fw-semibold">Subtotal :</p>
                    <p className="text-body-emphasis fw-semibold">PKR {(totalPrice - discount).toLocaleString()}</p>
                  </div>
                  <div className="d-flex justify-content-between">
                    <p className="text-body fw-semibold">Shipping Cost :</p>
                    <p className="text-body-emphasis fw-semibold">PKR {shipping}</p>
                  </div>
                </div>
                <div className="input-group mb-3">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Voucher"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                  />
                  <button className="btn btn-phoenix-primary px-5" onClick={applyCoupon}>Apply</button>
                </div>
                <div className="d-flex justify-content-between border-y border-dashed py-3 mb-4">
                  <h4 className="mb-0">Total :</h4>
                  <h4 className="mb-0">PKR {(totalPrice + shipping - discount).toLocaleString()}</h4>
                </div>
                <button className="btn btn-primary w-100" onClick={proceedCheckout}>
                  Proceed to check out<span className="fas fa-chevron-right ms-1 fs-10"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
