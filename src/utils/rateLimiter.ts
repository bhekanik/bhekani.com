import { hashIp } from "./hashIp"

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkLimit(ip: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
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

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

export const viewsRateLimiter = new RateLimiter(10, 60000)

setInterval(() => {
  viewsRateLimiter.cleanup()
}, 60000)