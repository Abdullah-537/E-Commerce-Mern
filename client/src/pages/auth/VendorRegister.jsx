import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../store/slices/authSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VendorRegister() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    businessName: '', businessEmail: '', businessPhone: '',
    bankName: '', accountNumber: '', accountTitle: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/vendor/register', formData)
      toast.success(data.message || 'Registration successful. Check email for OTP.')
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h5 className="mb-4 text-body-emphasis">Step 1: Account Details</h5>
            <div className="mb-3 text-start">
              <label className="form-label">Your Name</label>
              <input type="text" className="form-control" value={formData.name} placeholder="Name"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={formData.email} placeholder="name@example.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-control" value={formData.phone} placeholder="03001234567"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="mb-4 text-start">
              <label className="form-label">Password</label>
              <div className="position-relative">
                <input className="form-control pe-6" type={showPassword ? 'text' : 'password'} placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                <button className="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary" type="button"
                  onClick={() => setShowPassword(!showPassword)}>
                  <span className={`uil ${showPassword ? 'uil-eye-slash' : 'uil-eye'}`}></span>
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-100" type="button" onClick={() => setStep(2)}>Next Step</button>
          </>
        )
      case 2:
        return (
          <>
            <h5 className="mb-4 text-body-emphasis">Step 2: Business Details</h5>
            <div className="mb-3 text-start">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-control" value={formData.businessName} placeholder="Your Store Name"
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Business Email</label>
              <input type="email" className="form-control" value={formData.businessEmail} placeholder="store@example.com"
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })} />
            </div>
            <div className="mb-4 text-start">
              <label className="form-label">Business Phone</label>
              <input type="tel" className="form-control" value={formData.businessPhone} placeholder="03001234567"
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-phoenix-secondary w-50" type="button" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary w-50" type="button" onClick={() => setStep(3)}>Next Step</button>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <h5 className="mb-4 text-body-emphasis">Step 3: Bank Details</h5>
            <div className="mb-3 text-start">
              <label className="form-label">Bank Name</label>
              <input type="text" className="form-control" value={formData.bankName} placeholder="e.g. HBL"
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Account Number (IBAN)</label>
              <input type="text" className="form-control" value={formData.accountNumber} placeholder="PK..."
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required />
            </div>
            <div className="mb-4 text-start">
              <label className="form-label">Account Title</label>
              <input type="text" className="form-control" value={formData.accountTitle} placeholder="Account Holder Name"
                onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })} required />
            </div>
            <div className="form-check mb-4 text-start">
              <input className="form-check-input" id="termsService" type="checkbox" required />
              <label className="form-label fs-9 text-transform-none" htmlFor="termsService">I accept the terms and privacy policy</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-phoenix-secondary w-50" type="button" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary w-50" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Complete'}
              </button>
            </div>
          </>
        )
    }
  }

  return (
    <main className="container-fluid px-0" id="top">
      <div className="row vh-100 g-0">
        <div className="col-lg-6 position-relative d-none d-lg-block">
          <div className="bg-holder" style={{backgroundImage:'url(https://prium.github.io/phoenix/v1.24.0/assets/img/bg/38.png)'}}></div>
        </div>
        <div className="col-lg-6">
          <div className="row flex-center h-100 g-0 px-4 px-sm-0">
            <div className="col col-sm-6 col-lg-7 col-xl-6">
              <Link className="d-flex flex-center text-decoration-none mb-4" to="/">
                <div className="d-flex align-items-center fw-bolder fs-3 d-inline-block"><img src="/assets/img/icons/logo.png" alt="shopzone" width="58" /></div>
              </Link>
              <div className="text-center mb-5">
                <h3 className="text-body-highlight">Become a Vendor</h3>
                <p className="text-body-tertiary">Start selling your products on ShopZone</p>
                <div className="d-flex justify-content-center gap-2 mt-4">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step >= s ? 'bg-primary text-white' : 'bg-body-secondary text-body-tertiary'}`}
                      style={{ width: 32, height: 32 }}>{s}</div>
                  ))}
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                {renderStep()}
              </form>
              <div className="text-center mt-4"><Link className="fs-9 fw-bold" to="/vendor/login">Already a vendor? Login</Link></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}