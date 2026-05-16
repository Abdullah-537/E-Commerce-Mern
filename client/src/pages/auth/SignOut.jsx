import { Link } from 'react-router-dom'

export default function SignOut() {
  return (
    <main className="container-fluid px-0" id="top">
      <div className="row vh-100 g-0">
        <div className="col-lg-6 position-relative d-none d-lg-block">
          <div className="bg-holder" style={{backgroundImage:'url(https://prium.github.io/phoenix/v1.24.0/assets/img/bg/33.png)'}}></div>
        </div>
        <div className="col-lg-6">
          <div className="row flex-center h-100 g-0 px-4 px-sm-0">
            <div className="col col-sm-6 col-lg-7 col-xl-6 text-center">
              <Link className="d-flex flex-center text-decoration-none mb-4" to="/">
                <div className="d-flex align-items-center fw-bolder fs-3 d-inline-block"><img src="/assets/img/icons/logo.png" alt="shopzone" width="58" /></div>
              </Link>
              <div className="text-center mb-6">
                <h4 className="text-body-highlight">Come back soon!</h4>
                <p className="text-body-tertiary">Thanks for using ShopZone. You are now successfully signed out.</p>
              </div>
              <div className="d-grid">
                <Link className="btn btn-primary" to="/login">
                  <span className="fas fa-angle-left me-2"></span>Go to sign in page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
