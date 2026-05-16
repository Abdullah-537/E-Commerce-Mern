import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'dxudgah56'
  }
});

/**
 * Extract Cloudinary public_id from a full Cloudinary URL
 * e.g. "https://res.cloudinary.com/dxudgah56/image/upload/v123/shopzone/products/abc.jpg"
 *  → "shopzone/products/abc"
 */
export const getPublicId = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let path = parts[1];
    // Remove version prefix (v1234567890/)
    path = path.replace(/^v\d+\//, '');
    // Remove file extension
    path = path.replace(/\.[^/.]+$/, '');
    return path;
  } catch {
    return null;
  }
};

export default cld;
