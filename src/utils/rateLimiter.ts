import { hashIp } from "./hashIp"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const RATE_LIMIT_MAX_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60000

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW_MS) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkLimit(ip: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    this.cleanup()
    
    const hashedIp = await hashIp(ip)
    const now = Date.now()
    const entry = this.limits.get(hashedIp)

    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs
      this.limits.set(hashedIp, {
        count: 1,
        resetTime,
      })
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
  
  get maxRequestsLimit(): number {
    return this.maxRequests
  }
}

const isProduction = process.env.NODE_ENV === 'production'

export const viewsRateLimiter = isProduction 
  ? {
      async checkLimit(_ip: string): Promise<{
        allowed: boolean
        remaining: number  
        resetTime: number
      }> {
        return { 
          allowed: true, 
          remaining: RATE_LIMIT_MAX_REQUESTS, 
          resetTime: Date.now() + RATE_LIMIT_WINDOW_MS 
        }
      },
      maxRequestsLimit: RATE_LIMIT_MAX_REQUESTS
    }
  : new RateLimiter()