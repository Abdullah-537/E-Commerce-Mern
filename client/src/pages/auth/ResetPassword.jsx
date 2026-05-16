import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Password reset successful')
      navigate('/login')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow-lg" style={{ width: 400 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h4 className="mb-1">Reset Password</h4>
            <p className="text-muted small">Enter your new password</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}