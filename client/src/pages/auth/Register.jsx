import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { auth } from '../../config/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const token = await result.user.getIdToken()
      
      const { data } = await api.post('/auth/firebase', { token })
      
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      toast.success('Registration/Login successful via Google')
      navigate('/')
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Google Auth failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', formData)
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      toast.success('Registration successful')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container-fluid px-0" id="top">
      <div className="row vh-100 g-0">
        <div className="col-lg-6 position-relative d-none d-lg-block">
          <div className="bg-holder" style={{backgroundImage:'url(https://prium.github.io/phoenix/v1.24.0/assets/img/bg/32.png)'}}></div>
        </div>
        <div className="col-lg-6">
          <div className="row flex-center h-100 g-0 px-4 px-sm-0">
            <div className="col col-sm-6 col-lg-7 col-xl-6">
              <Link className="d-flex flex-center text-decoration-none mb-4" to="/">
                <div className="d-flex align-items-center fw-bolder fs-3 d-inline-block"><img src="/assets/img/icons/logo.png" alt="shopzone" width="58" /></div>
              </Link>
              <div className="text-center mb-7">
                <h3 className="text-body-highlight">Sign Up</h3>
                <p className="text-body-tertiary">Create your account today</p>
              </div>
              <button className="btn btn-phoenix-secondary w-100 mb-3" onClick={handleGoogleLogin} disabled={loading}>
                <span className="fab fa-google text-danger me-2 fs-9"></span>Sign up with Google
              </button>
              <div className="position-relative mt-4">
                <hr className="bg-body-secondary" />
                <div className="divider-content-center">or use email</div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3 text-start">
                  <label className="form-label" htmlFor="name">Name</label>
                  <input className="form-control" id="name" type="text" placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required />
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input className="form-control" id="email" type="email" placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required />
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label" htmlFor="phone">Phone (e.g., 03001234567)</label>
                  <input className="form-control" id="phone" type="tel" placeholder="03001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="position-relative">
                      <input className="form-control form-icon-input pe-6" id="password" type={showPassword ? 'text' : 'password'} placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required />
                      <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary" type="button"
                        onClick={() => setShowPassword(!showPassword)}>
                        <span className={`uil ${showPassword ? 'uil-eye-slash' : 'uil-eye'}`}></span>
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="position-relative">
                      <input className="form-control form-icon-input pe-6" id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required />
                      <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary" type="button"
                        onClick={() => setShowConfirm(!showConfirm)}>
                        <span className={`uil ${showConfirm ? 'uil-eye-slash' : 'uil-eye'}`}></span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" id="termsService" type="checkbox" required />
                  <label className="form-label fs-9 text-transform-none" htmlFor="termsService">I accept the <a href="#">terms </a>and <a href="#">privacy policy</a></label>
                </div>
                <button className="btn btn-primary w-100 mb-3" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
                <div className="text-center"><Link className="fs-9 fw-bold" to="/login">Sign in to an existing account</Link></div>
                <div className="text-center mt-2"><Link className="fs-9 fw-bold" to="/vendor/register">Want to sell? Register as a Vendor</Link></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}