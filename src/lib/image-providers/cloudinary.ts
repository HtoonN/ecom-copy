import { v2 as cloudinary } from 'cloudinary'
import type { ImageUploadProvider } from '../image-upload'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const cloudinaryProvider: ImageUploadProvider = {
  async upload(dataUri, folder) {
    const result = await cloudinary.uploader.upload(dataUri, { folder })
    return { url: result.secure_url, publicId: result.public_id }
  },

  // Best-effort cleanup — a failed delete shouldn't fail the request that
  // triggered it (e.g. replacing an image), so this never throws.
  async delete(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (error) {
      console.error('Failed to delete Cloudinary asset', publicId, error)
    }
  },

  // Only our own Cloudinary-hosted images should ever be deleted — external
  // affiliate image URLs (Shopee/Lazada) must return null here.
  publicIdFromUrl(url) {
    if (!url.includes('res.cloudinary.com')) return null
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:\?.*)?$/)
    return match ? match[1] : null
  },
}
