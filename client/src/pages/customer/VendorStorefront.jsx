import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

export default function VendorStorefront() {
  const { slug } = useParams()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/vendor/store/${slug}`),
      api.get(`/products`)
    ]).then(([v, p]) => {
      setVendor(v.data.data)
      setProducts(p.data.data.filter(prod => prod.vendorId?.slug === slug))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>
  if (!vendor) return <div className="text-center py-5"><h4>Store not found</h4></div>

  return (
    <div>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body text-center py-4">
          <img src={vendor.logo || '/assets/img/generic/avatar.png'} alt="" className="rounded-circle mb-3" style={{ width: 80, height: 80 }} />
          <h3>{vendor.businessName}</h3>
          <p className="text-muted">{vendor.description}</p>
          {vendor.isOpen ? <span className="badge bg-success">Open</span> : <span className="badge bg-secondary">Closed</span>}
        </div>
      </div>
      <h5>Products from {vendor.businessName}</h5>
      <div className="row g-4 mt-2">
        {products.length > 0 ? products.map(p => (
          <div className="col-md-3 col-6" key={p._id}>
            <Link to={`/products/${p._id}`} className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm">
                <img src={p.images[0] || '/assets/img/products/60x60/1.png'} className="card-img-top" style={{ height: 200, objectFit: 'cover' }} />
                <div className="card-body">
                  <h6>{p.name}</h6>
                  <span className="text-primary">PKR {p.salePrice || p.price}</span>
                </div>
              </div>
            </Link>
          </div>
        )) : <p className="text-muted">No products yet</p>}
      </div>
    </div>
  )
}