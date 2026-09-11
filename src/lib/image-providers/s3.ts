import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { ImageUploadProvider } from '../image-upload'

// Credentials come from the default AWS chain — the App Runner instance role in
// production, AWS_PROFILE locally. No access keys are read from the environment.
const region = process.env.AWS_REGION || 'ap-southeast-1'
const bucket = process.env.S3_BUCKET

// Set S3_PUBLIC_BASE_URL to serve through CloudFront or a custom domain later;
// without it, images are served straight from the bucket's virtual-hosted URL.
const publicBase = (
  process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`
).replace(/\/+$/, '')

const client = new S3Client({ region })

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function parseDataUri(dataUri: string): { contentType: string; body: Buffer; extension: string } {
  const match = dataUri.match(/^data:([^;,]+);base64,([\s\S]+)$/)
  if (!match) throw new Error('Image must be a base64 data URI.')

  const contentType = match[1].toLowerCase()
  const extension = EXTENSIONS[contentType]
  if (!extension) throw new Error(`Unsupported image type: ${contentType}`)

  return { contentType, body: Buffer.from(match[2], 'base64'), extension }
}

export const s3Provider: ImageUploadProvider = {
  async upload(dataUri, folder) {
    if (!bucket) throw new Error('S3_BUCKET is not set.')

    const { contentType, body, extension } = parseDataUri(dataUri)
    // Keys are random, so an object's bytes never change and it can be cached
    // indefinitely. Replacing an image writes a new key rather than mutating one.
    const key = `${folder.replace(/^\/+|\/+$/g, '')}/${randomUUID()}.${extension}`

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )

    return { url: `${publicBase}/${key}`, publicId: key }
  },

  // Best-effort cleanup — a failed delete shouldn't fail the request that
  // triggered it (e.g. replacing an image), so this never throws.
  async delete(publicId) {
    if (!bucket) return
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: publicId }))
    } catch (error) {
      console.error('Failed to delete S3 object', publicId, error)
    }
  },

  // Only our own bucket-hosted images should ever be deleted — external
  // affiliate image URLs (Shopee/Lazada) must return null here.
  publicIdFromUrl(url) {
    if (!bucket) return null
    if (!url.startsWith(`${publicBase}/`)) return null

    const key = url.slice(publicBase.length + 1).split('?')[0]
    return key ? decodeURIComponent(key) : null
  },
}
