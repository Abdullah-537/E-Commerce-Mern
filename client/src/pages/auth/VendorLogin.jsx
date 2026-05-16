import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VendorLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', formData)
      if (data.data.user.role !== 'vendor') {
        toast.error('Vendor account required')
        setLoading(false)
        return
      }
      const userData = data.data.vendor 
        ? { ...data.data.user, vendor: data.data.vendor } 
        : data.data.user
      dispatch(setCredentials({ user: userData, accessToken: data.data.accessToken }))
      toast.success('Login successful')
      navigate('/vendor')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container-fluid px-0" id="top">
      <div className="row vh-100 g-0">
        <div className="col-lg-6 position-relative d-none d-lg-block">
          <div className="bg-holder" style={{backgroundImage:'url(https://prium.github.io/phoenix/v1.24.0/assets/img/bg/31.png)'}}></div>
        </div>
        <div className="col-lg-6">
          <div className="row flex-center h-100 g-0 px-4 px-sm-0">
            <div className="col col-sm-6 col-lg-7 col-xl-6">
              <Link className="d-flex flex-center text-decoration-none mb-4" to="/">
                <div className="d-flex align-items-center fw-bolder fs-3 d-inline-block"><img src="/assets/img/icons/logo.png" alt="shopzone" width="58" /></div>
              </Link>
              <div className="text-center mb-7">
                <h3 className="text-body-highlight">Vendor Login</h3>
                <p className="text-body-tertiary">Sign in to your vendor account</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3 text-start">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <div className="form-icon-container">
                    <input className="form-control form-icon-input" id="email" type="email" placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required />
                    <span className="fas fa-user text-body fs-9 form-icon"></span>
                  </div>
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="form-icon-container position-relative">
                    <input className="form-control form-icon-input pe-6" id="password" type={showPassword ? 'text' : 'password'} placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required />
                    <span className="fas fa-key text-body fs-9 form-icon"></span>
                    <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary" type="button"
                      onClick={() => setShowPassword(!showPassword)}>
                      <span className={`uil ${showPassword ? 'uil-eye-slash' : 'uil-eye'}`}></span>
                    </button>
                  </div>
                </div>
                <div className="row flex-between-center mb-7">
                  <div className="col-auto">
                    <div className="form-check mb-0">
                      <input className="form-check-input" id="basic-checkbox" type="checkbox" defaultChecked />
                      <label className="form-check-label mb-0" htmlFor="basic-checkbox">Remember me</label>
                    </div>
                  </div>
                  <div className="col-auto"><Link className="fs-9 fw-semibold" to="/forgot-password">Forgot Password?</Link></div>
                </div>
                <button className="btn btn-primary w-100 mb-3" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="text-center"><Link className="fs-9 fw-bold" to="/vendor/register">Want to sell on ShopZone? Register</Link></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}