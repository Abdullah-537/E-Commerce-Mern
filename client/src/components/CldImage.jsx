import { AdvancedImage, lazyload, placeholder } from '@cloudinary/react';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import cld, { getPublicId } from '../config/cloudinary';

/**
 * CldImage — Drop-in replacement for <img> that auto-optimizes via Cloudinary.
 * 
 * Usage:
 *   <CldImage src={product.images[0]} width={400} height={400} alt="Product" className="img-fluid" />
 * 
 * Props:
 *   - src: Cloudinary URL or any image URL
 *   - width / height: desired dimensions (optional)
 *   - alt, className, style: passed through
 *   - crop: Cloudinary crop mode (default: 'auto')
 */
export default function CldImage({ src, width, height, alt = '', className = '', style = {}, crop = 'auto' }) {
  const publicId = getPublicId(src);

  // If it's not a Cloudinary URL, fall back to a regular <img>
  if (!publicId) {
    return (
      <img
        src={src || '/assets/img/products/60x60/1.png'}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
      />
    );
  }

  // Build optimized Cloudinary image
  let img = cld.image(publicId).format('auto').quality('auto');

  if (width || height) {
    let resize = auto().gravity(autoGravity());
    if (width) resize = resize.width(width);
    if (height) resize = resize.height(height);
    img = img.resize(resize);
  }

  return (
    <AdvancedImage
      cldImg={img}
      plugins={[lazyload(), placeholder({ mode: 'blur' })]}
      alt={alt}
      className={className}
      style={style}
    />
  );
}
