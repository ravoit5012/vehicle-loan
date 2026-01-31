import * as fs from 'fs'
import * as path from 'path'

export async function uploadToStorage(
  fileBuffer: Buffer,
  relativePath: string
): Promise<string> {
  const uploadRoot = process.env.UPLOAD_DIR || 'uploads'

  // Full file path
  const fullPath = path.join(uploadRoot, relativePath)

  // Ensure directory exists
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Write file
  await fs.promises.writeFile(fullPath, fileBuffer)

  const fileUrl = `/files${relativePath.replace(/\\/g, '/')}`
  
  return `${fileUrl}`
}
