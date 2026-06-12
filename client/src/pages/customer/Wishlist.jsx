import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { setCart } from '../../store/slices/cartSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    api.get('/wishlist')
      .then(res => setWishlist(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const remove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`)
      setWishlist({ ...wishlist, items: wishlist.items.filter(i => i.productId._id !== productId) })
      toast.success('Removed from wishlist')
    } catch (err) { toast.error('Failed') }
  }

  const addToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.info('Please login first')
      return navigate('/login', { state: { from: location } })
    }
    try {
      await api.post('/cart', { productId, quantity: 1 })
      const { data } = await api.get('/cart')
      dispatch(setCart(data.data))
      toast.success('Added to cart')
    } catch (err) {
      toast.error('Failed to add to cart')
    }
  }

  if (loading) return <div className="text-center py-9"><div className="spinner-border text-primary"></div></div>

  if (!wishlist?.items?.length) {
    return (
      <section className="pt-5 pb-9 bg-body flex-1">
        <div className="container-small cart">
          <div className="text-center py-9">
            <span className="far fa-heart fs-5 text-body-quaternary mb-4 d-block"></span>
            <h3 className="text-body-emphasis">Your wishlist is empty</h3>
            <p className="text-body-tertiary mb-4">Save your favorite items here for later.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
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
            <li className="breadcrumb-item active" aria-current="page">Wishlist</li>
          </ol>
        </nav>
        <h2 className="mb-5">Wishlist<span className="text-body-tertiary fw-normal ms-2">({wishlist.items.length})</span></h2>
        <div className="border-y border-translucent">
          <div className="table-responsive scrollbar">
            <table className="table fs-9 mb-0">
              <thead>
                <tr>
                  <th className="sort white-space-nowrap align-middle fs-10" scope="col" style={{ width: '7%' }}></th>
                  <th className="sort white-space-nowrap align-middle" scope="col" style={{ width: '30%', minWidth: 250 }}>PRODUCTS</th>
                  <th className="sort align-middle text-end" scope="col" style={{ width: '10%' }}>PRICE</th>
                  <th className="sort align-middle text-end pe-0" scope="col" style={{ width: '35%' }}></th>
                </tr>
              </thead>
              <tbody className="list">
                {wishlist.items.map(item => (
                  <tr className="hover-actions-trigger btn-reveal-trigger position-static" key={item._id}>
                    <td className="align-middle white-space-nowrap ps-0 py-0">
                      <Link className="border border-translucent rounded-2 d-inline-block" to={`/products/${item.productId._id}`}>
                        <img src={item.productId.images?.[0] || '/assets/img/products/60x60/1.png'} alt="" width="53" />
                      </Link>
                    </td>
                    <td className="products align-middle pe-11">
                      <Link className="fw-semibold mb-0 line-clamp-1" to={`/products/${item.productId._id}`}>
                        {item.productId.name}
                      </Link>
                    </td>
                    <td className="price align-middle text-body fs-9 fw-semibold text-end">
                      PKR {(item.productId.salePrice || item.productId.price || 0).toLocaleString()}
                    </td>
                    <td className="total align-middle fw-bold text-body-highlight text-end text-nowrap pe-0">
                      <button
                        className="btn btn-sm text-body-quaternary text-body-tertiary-hover me-2"
                        onClick={() => remove(item.productId._id)}
                      >
                        <span className="fas fa-trash"></span>
                      </button>
                      <button
                        className="btn btn-primary fs-10"
                        onClick={() => addToCart(item.productId._id)}
                      >
                        <span className="fas fa-shopping-cart me-1 fs-10"></span>Add to cart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
