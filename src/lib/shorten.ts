import { nanoid } from 'nanoid'
import { prisma } from '../db'
import { normalizeUrl, isValidUrl } from './utils'

export interface CreateShortLinkInput {
  originalUrl: string
  length?: number
  userId?: string | null
}

export interface CreateShortLinkResult {
  id: number
  originalUrl: string
  shortId: string
  length: number
  userId: string | null
  createdAt: Date
}

const MAX_RETRIES = 5

/**
 * Create short link with duplicate and uniqueness check
 */
export async function createShortLink(
  input: CreateShortLinkInput,
): Promise<CreateShortLinkResult> {
  const normalizedUrl = normalizeUrl(input.originalUrl)

  if (!isValidUrl(normalizedUrl)) {
    throw new Error('Invalid URL')
  }

  const length = input.length ?? 6
  if (length < 4 || length > 20) {
    throw new Error('Length must be between 4 and 20')
  }

  // Check if the original link exists in the database
  const existingLink = await prisma.shortLink.findFirst({
    where: {
      originalUrl: normalizedUrl,
      ...(input.userId ? { userId: input.userId } : { userId: null }),
    },
  })

  if (existingLink) {
    return {
      id: existingLink.id,
      originalUrl: existingLink.originalUrl,
      shortId: existingLink.shortId,
      length: existingLink.length,
      userId: existingLink.userId,
      createdAt: existingLink.createdAt,
    }
  }

  let shortId: string | undefined
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    shortId = nanoid(length)
    const existing = await prisma.shortLink.findUnique({
      where: { shortId },
    })

    if (!existing) {
      break
    }

    attempts++
  }

  if (!shortId) {
    throw new Error('Failed to generate unique shortId after multiple attempts')
  }

  const shortLink = await prisma.shortLink.create({
    data: {
      originalUrl: normalizedUrl,
      shortId,
      length,
      userId: input.userId ?? null,
    },
  })

  return {
    id: shortLink.id,
    originalUrl: shortLink.originalUrl,
    shortId: shortLink.shortId,
    length: shortLink.length,
    userId: shortLink.userId,
    createdAt: shortLink.createdAt,
  }
}

/**
 * Get short link by shortId
 */
export async function getShortLinkByShortId(shortId: string) {
  return prisma.shortLink.findUnique({
    where: { shortId },
    select: {
      id: true,
      originalUrl: true,
    }
  })
}

