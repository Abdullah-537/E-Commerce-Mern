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

function replaceSwiperWrapperContent(html, searchAnchor) {
    let anchorIdx = html.indexOf(searchAnchor);
    if (anchorIdx === -1) return html;
    
    let wrapperStartStr = '<div className="swiper-wrapper">';
    let wrapperStartIdx = html.indexOf(wrapperStartStr, anchorIdx);
    if (wrapperStartIdx === -1) return html;
    
    let contentStart = wrapperStartIdx + wrapperStartStr.length;
    
    // We want to replace everything until the matching </div> that closes swiper-wrapper.
    // The structure is <div className="swiper-wrapper"> ... slides ... </div>
    // Let's find the </div> that comes right before <div className="swiper-nav"
    let navIdx = html.indexOf('<div className="swiper-nav', contentStart);
    if (navIdx === -1) return html;
    
    // Find the closest </div> before swiper-nav
    // Actually, swiper-nav is a sibling of swiper-wrapper.
    // So swiper-wrapper closes right before swiper-nav.
    // Let's find the closing </div> of swiper-wrapper which should be right before swiper-nav (ignoring whitespace).
    let contentEnd = html.lastIndexOf('</div>', navIdx);
    if (contentEnd === -1 || contentEnd < contentStart) return html;
    
    // We replace html between contentStart and contentEnd with productCardJSX
    return html.substring(0, contentStart) + "\\n" + productCardJSX + "\\n" + html.substring(contentEnd);
}

// Replace Top Electronics
content = replaceSwiperWrapperContent(content, '<h3>Top Electronics</h3>');

// Replace the 3rd one, which is after "Explore more" link
// Let's use a unique anchor for the 3rd slider
// Wait, in my previous output, it was after "Explore more" but there are multiple "Explore more"
// Let's search for the 3rd swiper-wrapper
let thirdWrapperIdx = content.lastIndexOf('<div className="swiper-wrapper">');
if (thirdWrapperIdx !== -1) {
    let contentStart = thirdWrapperIdx + '<div className="swiper-wrapper">'.length;
    let navIdx = content.indexOf('<div className="swiper-nav', contentStart);
    if (navIdx !== -1) {
        let contentEnd = content.lastIndexOf('</div>', navIdx);
        content = content.substring(0, contentStart) + "\\n" + productCardJSX + "\\n" + content.substring(contentEnd);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Static products replaced successfully via exact substring matching.');
