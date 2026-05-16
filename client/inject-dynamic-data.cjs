const fs = require('fs');

const path = 'e:/FSWD/Project/shopzone/client/src/pages/customer/Homepage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\nimport { useState, useEffect } from 'react';\nimport api from '../../store/api/baseApi';");

// 2. Add state and fetch logic
const componentStart = "export default function Homepage() {";
const fetchLogic = `
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=12')
      .then(res => {
        setProducts(res.data.data.products || res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
`;
content = content.replace(componentStart, componentStart + "\n" + fetchLogic);

// 3. Define the product card JSX string to inject
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

// 4. Replace the static Swiper wrappers
// The string '<div className="swiper-wrapper">' appears multiple times.
// We want to replace the contents of the 'Top Deals today' and 'Top Electronics' wrappers.
// It's easier to find the section headers and replace the next swiper-wrapper content.

function replaceSwiperContent(html, headerSearchStr) {
  const headerIdx = html.indexOf(headerSearchStr);
  if (headerIdx === -1) return html;
  
  const wrapperStartMatch = html.indexOf('<div className="swiper-wrapper">', headerIdx);
  if (wrapperStartMatch === -1) return html;
  
  const wrapperStart = wrapperStartMatch + '<div className="swiper-wrapper">'.length;
  
  // Find the end of this wrapper
  // We'll just look for the next '</div>' that closes it.
  // Actually, since it has many slides, it's easier to look for the end of the wrapper by finding the next `<div className="swiper-nav swiper-product-nav">` or similar
  const navIdx = html.indexOf('<div className="swiper-nav', wrapperStart);
  if (navIdx === -1) return html;
  
  // The wrapper ends right before the nav wrapper div (actually there is a </div> to close swiper-wrapper and another to close swiper)
  // Let's find the closing </div> of swiper-wrapper
  const endWrapperIdx = html.lastIndexOf('</div>', html.lastIndexOf('</div>', navIdx - 1) - 1);
  
  // Or even simpler: we just regex replace everything between `<div className="swiper-wrapper">` and `</div>\n                </div>\n                <div className="swiper-nav`
  return html.substring(0, wrapperStart) + '\\n' + productCardJSX + '\\n' + html.substring(navIdx - 40); // roughly
}

// Let's use regex to replace the content of swiper-wrapper
// Since there are multiple swiper-theme-container products-slider, we can just replace all of their swiper-wrapper contents!
content = content.replace(/(<div className="swiper-theme-container products-slider">[\s\S]*?<div className="swiper-wrapper">)[\s\S]*?(<\/div>\s*<\/div>\s*<div className="swiper-nav)/g, "$1\n" + productCardJSX + "\n$2");

fs.writeFileSync(path, content, 'utf8');
console.log('Homepage injected with dynamic database logic!');
