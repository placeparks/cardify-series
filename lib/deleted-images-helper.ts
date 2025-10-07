/**
 * Helper functions for working with deleted images
 */

export interface DeletedImage {
  id: string
  original_asset_id: string
  seller_id: string
  title: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  width: number | null
  height: number | null
  metadata: string
  deleted_at: string
  deleted_by: string
  deletion_reason: string
  has_been_sold: boolean
  last_sale_date: string | null
  total_sales_count: number
  created_at: string
  download_url?: string
  parsed_metadata?: any
}

/**
 * Get deleted images by different criteria
 */
export async function getDeletedImages(options: {
  deletedRecordId?: string
  originalAssetId?: string
  sellerId?: string
  fileName?: string // NEW: Search by filename
  limit?: number
}): Promise<DeletedImage[]> {
  const params = new URLSearchParams()
  
  if (options.deletedRecordId) params.append('deletedRecordId', options.deletedRecordId)
  if (options.originalAssetId) params.append('originalAssetId', options.originalAssetId)
  if (options.sellerId) params.append('sellerId', options.sellerId)
  if (options.fileName) params.append('fileName', options.fileName) // NEW
  if (options.limit) params.append('limit', options.limit.toString())

  const response = await fetch(`/api/deleted-images/get?${params.toString()}`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch deleted images')
  }

  return data.images
}

/**
 * Get a specific deleted image by its file path
 */
export async function getDeletedImageByPath(filePath: string): Promise<DeletedImage | null> {
  const response = await fetch('/api/deleted-images/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath })
  })

  const data = await response.json()

  if (!data.success) {
    return null
  }

  return data.image
}

/**
 * Get a specific deleted image by its deletion record ID
 */
export async function getDeletedImageById(deletedRecordId: string): Promise<DeletedImage | null> {
  const response = await fetch('/api/deleted-images/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedRecordId })
  })

  const data = await response.json()

  if (!data.success) {
    return null
  }

  return data.image
}

/**
 * Get all deleted images for a specific seller (user)
 */
export async function getDeletedImagesBySeller(sellerId: string, limit: number = 50): Promise<DeletedImage[]> {
  return getDeletedImages({ sellerId, limit })
}

/**
 * Get deleted images by original asset ID
 */
export async function getDeletedImagesByOriginalAsset(originalAssetId: string): Promise<DeletedImage[]> {
  return getDeletedImages({ originalAssetId })
}

/**
 * Get deleted image by filename (SUPER SIMPLE!)
 */
export async function getDeletedImageByFileName(fileName: string): Promise<DeletedImage[]> {
  return getDeletedImages({ fileName })
}

/**
 * Get deleted image by database ID (SUPER SIMPLE!)
 * This is the easiest way - just use the deleted_images table ID
 */
export async function getDeletedImageByDatabaseId(deletedImageId: string): Promise<DeletedImage | null> {
  const images = await getDeletedImages({ deletedRecordId: deletedImageId })
  return images.length > 0 ? images[0] : null
}

/**
 * Helper to identify which deleted image you're looking for
 */
export function identifyDeletedImage(
  deletedImages: DeletedImage[],
  criteria: {
    fileName?: string
    originalAssetId?: string
    deletedAt?: string
    hasBeenSold?: boolean
  }
): DeletedImage | null {
  return deletedImages.find(image => {
    if (criteria.fileName && image.file_name !== criteria.fileName) return false
    if (criteria.originalAssetId && image.original_asset_id !== criteria.originalAssetId) return false
    if (criteria.deletedAt && image.deleted_at !== criteria.deletedAt) return false
    if (criteria.hasBeenSold !== undefined && image.has_been_sold !== criteria.hasBeenSold) return false
    return true
  }) || null
}

/**
 * Example usage scenarios - SUPER SIMPLE NOW!
 */
export const DeletedImageExamples = {
  // Scenario 1: Use the deleted_images table ID (SUPER EASY!)
  getByDatabaseId: async (deletedImageId: string) => {
    // From your JSON: "id":"12d87e0f-3db7-49a3-ac69-d7699a63372b"
    return getDeletedImageByDatabaseId(deletedImageId)
  },

  // Scenario 2: You have the original asset ID and want to find its deleted version
  getByOriginalAsset: async (originalAssetId: string) => {
    return getDeletedImagesByOriginalAsset(originalAssetId)
  },

  // Scenario 3: Get all deleted images for a seller
  getBySeller: async (sellerId: string) => {
    return getDeletedImagesBySeller(sellerId)
  },

  // Scenario 4: Get all sold images that were deleted
  getSoldAndDeleted: async (sellerId: string) => {
    const allDeleted = await getDeletedImagesBySeller(sellerId)
    return allDeleted.filter(image => image.has_been_sold)
  },

  // SUPER SIMPLE: Just use the ID from your JSON data!
  getByJsonId: async (jsonId: string) => {
    // From your JSON: "id":"12d87e0f-3db7-49a3-ac69-d7699a63372b"
    return getDeletedImageByDatabaseId(jsonId)
  }
}
