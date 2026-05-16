import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('If email exists, reset link sent')
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: 400 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <img src="/assets/img/icons/logo.png" alt="ShopZone" style={{ height: 50 }} />
            <h4 className="mt-3">Reset Password</h4>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="text-success mb-3">
                <i className="fas fa-check-circle fa-3x"></i>
              </div>
              <p>If this email exists, you will receive a password reset link shortly.</p>
              <Link to="/login" className="btn btn-primary">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-muted mb-3">Enter your email address and we'll send you a link to reset your password.</p>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}