import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/utils/hashIp', () => ({
  hashIp: vi.fn((ip: string) => Promise.resolve(`hashed-${ip}`))
}))

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should allow requests within limit', async () => {
    const { RateLimiter } = await import('../../src/utils/rateLimiter')
    const limiter = new (RateLimiter as any)(3, 60000)
    
    const result1 = await limiter.checkLimit('192.168.1.1')
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)
    
    const result2 = await limiter.checkLimit('192.168.1.1')
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)
    
    const result3 = await limiter.checkLimit('192.168.1.1')
    expect(result3.allowed).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should block requests after limit exceeded', async () => {
    const { RateLimiter } = await import('../../src/utils/rateLimiter')
    const limiter = new (RateLimiter as any)(2, 60000)
    
    await limiter.checkLimit('192.168.1.1')
    await limiter.checkLimit('192.168.1.1')
    
    const result = await limiter.checkLimit('192.168.1.1')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after window expires', async () => {
    const { RateLimiter } = await import('../../src/utils/rateLimiter')
    const limiter = new (RateLimiter as any)(1, 100)
    
    const result1 = await limiter.checkLimit('192.168.1.1')
    expect(result1.allowed).toBe(true)
    
    const result2 = await limiter.checkLimit('192.168.1.1')
    expect(result2.allowed).toBe(false)
    
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const result3 = await limiter.checkLimit('192.168.1.1')
    expect(result3.allowed).toBe(true)
  })

  it('should track different IPs separately', async () => {
    const { RateLimiter } = await import('../../src/utils/rateLimiter')
    const limiter = new (RateLimiter as any)(1, 60000)
    
    const result1 = await limiter.checkLimit('192.168.1.1')
    expect(result1.allowed).toBe(true)
    
    const result2 = await limiter.checkLimit('192.168.1.2')
    expect(result2.allowed).toBe(true)
    
    const result3 = await limiter.checkLimit('192.168.1.1')
    expect(result3.allowed).toBe(false)
    
    const result4 = await limiter.checkLimit('192.168.1.2')
    expect(result4.allowed).toBe(false)
  })
})