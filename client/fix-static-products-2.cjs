const fs = require('fs');
const path = 'e:/FSWD/Project/shopzone/client/src/pages/customer/Homepage.jsx';
let content = fs.readFileSync(path, 'utf8');

const productCardJSX = `
{loading ? (
  <div className="swiper-slide d-flex justify-content-center align-items-center" style={{height: '300px'}}>
    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
  </div>
) : products.map(product => (
  <div className="swiper-slide" key={product._id}>
    <div className="position-relative text-decoration-none product-card h-100">
      <div className="d-flex flex-column justify-content-between h-100">
        <div>
          <div className="border border-1 border-translucent rounded-3 position-relative mb-3">
            <button className="btn btn-wish btn-wish-primary z-2 d-toggle-container"
              data-bs-toggle="tooltip" data-bs-placement="top" title="Add to wishlist">
              <span className="fas fa-heart d-block-hover" data-fa-transform="down-1"></span>
              <span className="far fa-heart d-none-hover" data-fa-transform="down-1"></span>
            </button>
            <img className="img-fluid" src={product.images && product.images.length > 0 ? product.images[0].url : "/assets/img/products/1.png"} alt={product.name} />
          </div>
          <Link className="stretched-link" to={\`/product/\${product._id}\`}>
            <h6 className="mb-2 lh-sm line-clamp-3 product-name">
              {product.name}
            </h6>
          </Link>
          <p className="fs-9">
            <span className="fa fa-star text-warning"></span><span
              className="fa fa-star text-warning"></span><span
              className="fa fa-star text-warning"></span><span
              className="fa fa-star text-warning"></span><span className="fa fa-star text-warning"></span>
            <span className="text-body-quaternary fw-semibold ms-1">({Math.floor(Math.random() * 100)} people rated)</span>
          </p>
        </div>
        <div>
          <p className="fs-9 text-body-highlight fw-bold mb-2">
            {product.vendorId?.businessName || 'ShopZone Vendor'}
          </p>
          <div className="d-flex align-items-center mb-1">
            {product.salePrice ? (
              <>
                <p className="me-2 text-body text-decoration-line-through mb-0">
                  PKR {product.price}
                </p>
                <h3 className="text-body-emphasis mb-0">PKR {product.salePrice}</h3>
              </>
            ) : (
              <h3 className="text-body-emphasis mb-0">PKR {product.price}</h3>
            )}
          </div>
          <p className="text-body-tertiary fw-semibold fs-9 lh-1 mb-0">
            In Stock: {product.stock}
          </p>
        </div>
      </div>
    </div>
  </div>
))}
`;

content = content.replace(/(<div className="swiper-theme-container products-slider">[\s\S]*?<div className="swiper-wrapper">)[\s\S]*?(<\/div>\s*<\/div>\s*<div className="swiper-nav")/g, "$1\n" + productCardJSX + "\n$2");

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced all slider contents with dynamic products');
