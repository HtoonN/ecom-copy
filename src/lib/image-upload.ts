// Single integration point for image hosting. Every other file imports from
// HERE, never from a provider SDK directly — to switch image-upload
// providers (S3 -> Cloudinary, UploadThing, etc.), write a new file under
// src/lib/image-providers/ implementing ImageUploadProvider and change the
// one import below. No other file needs to change.

import { cloudinaryProvider } from './image-providers/cloudinary'

export type UploadedImage = { url: string; publicId: string }

export type ImageUploadProvider = {
  upload(dataUri: string, folder: string): Promise<UploadedImage>
  delete(publicId: string): Promise<void>
  publicIdFromUrl(url: string): string | null
}

const provider: ImageUploadProvider = cloudinaryProvider

export function uploadImage(dataUri: string, folder: string): Promise<UploadedImage> {
  return provider.upload(dataUri, folder)
}

export function deleteImage(publicId: string): Promise<void> {
  return provider.delete(publicId)
}

export function publicIdFromUrl(url: string): string | null {
  return provider.publicIdFromUrl(url)
}
