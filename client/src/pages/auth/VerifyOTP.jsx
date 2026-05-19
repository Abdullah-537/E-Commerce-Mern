import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VerifyOTP() {
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!emailParam) {
      toast.error('No email provided. Please register first.')
      navigate('/register')
    }
  }, [emailParam, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!otp) {
      return toast.error('Please enter the OTP')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp })
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      toast.success(data.message || 'Email verified successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-small" style={{ maxWidth: '400px', marginTop: '10vh', marginBottom: '10vh' }}>
      <div className="text-center mb-5">
        <Link className="d-flex flex-center text-decoration-none mb-4" to="/">
          <div className="d-flex align-items-center fw-bolder fs-3 d-inline-block">
            <span className="text-primary">Shop</span>
            <span className="text-body-highlight">Zone</span>
          </div>
        </Link>
        <h3 className="text-body-highlight">Verify Your Email</h3>
        <p className="text-body-tertiary">
          We've sent a 6-digit verification code to <br />
          <strong>{email}</strong>
        </p>
      </div>

      <div className="card shadow-none border border-translucent">
        <div className="card-body p-4 p-sm-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start">
              <label className="form-label" htmlFor="otp">Enter Verification Code</label>
              <input
                className="form-control form-control-lg text-center fw-bolder"
                id="otp"
                type="text"
                maxLength="6"
                placeholder="------"
                value={otp}
                autoComplete="off"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '0.5em', fontSize: '1.2rem' }}
              />
            </div>
            
            <button
              className="btn btn-primary w-100 mb-3"
              type="submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              Verify Email
            </button>
            <div className="text-center">
              <Link className="fs-9 fw-bold" to="/register">
                Register a different email
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
