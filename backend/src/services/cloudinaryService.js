import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'diyar-power-link';
export const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || '';
export const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || '';

export const useCloudinary = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

export { cloudinary };
