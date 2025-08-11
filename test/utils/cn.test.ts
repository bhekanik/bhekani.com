import { describe, it, expect } from 'vitest'
import { cn } from '../../src/utils/cn'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle conditional classes', () => {
    const result = cn('base-class', {
      'active-class': true,
      'inactive-class': false,
    })
    expect(result).toBe('base-class active-class')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['class-1', 'class-2'], 'class-3')
    expect(result).toBe('class-1 class-2 class-3')
  })

  it('should handle undefined and null values', () => {
    const result = cn('class-1', undefined, null, 'class-2')
    expect(result).toBe('class-1 class-2')
  })

  it('should merge Tailwind classes properly', () => {
    const result = cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')
    expect(result).toBe('hover:bg-red-600 bg-blue-500')
  })
})