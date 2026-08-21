import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, '../../src', relativePath), 'utf-8')
}

function readProject(name: string) {
  return JSON.parse(readSource(`content/projects/${name}.json`)) as {
    title: string
    url: string
    featured?: boolean
    appStoreUrl?: string
    published: boolean
  }
}

describe('Featured projects', () => {
  it.each([
    ['mxr', 'https://mxr.sh'],
    ['spotuify', 'https://spotuify.app'],
    ['worthyourtime', 'https://worthyourtime.xyz'],
  ])('%s is published, featured and points at %s', (name, url) => {
    const project = readProject(name)
    expect(project.published).toBe(true)
    expect(project.featured).toBe(true)
    expect(project.url).toBe(url)
  })

  it('Worth Your Time links to the App Store', () => {
    expect(readProject('worthyourtime').appStoreUrl).toMatch(/^https:\/\/apps\.apple\.com\//)
  })

  it('nothing else is featured', () => {
    const featured = ['blah-chat', 'cv-optimiser', 'dealbase', 'easydeck', 'imali', 'interview-optimiser', 'journaler', 'linganisa', 'pro-search', 'reference-optimiser']
      .map(readProject)
      .filter((project) => project.featured)
    expect(featured).toEqual([])
  })
})

describe('Homepage', () => {
  const content = readSource('pages/index.astro')

  it('renders featured projects from the collection', () => {
    expect(content).toContain('project.data.featured')
  })

  it('names Contentful and Notto with links', () => {
    expect(content).toContain('https://contentful.com/')
    expect(content).toContain('https://nottoafrica.com')
  })

  it('has the newsletter box with a subscribe link, not an iframe', () => {
    expect(content).toContain('Just Reflections')
    expect(content).toContain('Subscribe')
    expect(content).toContain('https://justreflections.bhekani.com/')
    expect(content).not.toContain('<iframe')
  })

  it('does not list Pro-search', () => {
    expect(content.toLowerCase()).not.toContain('pro-search')
    expect(content.toLowerCase()).not.toContain('prosearch')
  })
})

describe('About page', () => {
  const content = readSource('pages/about.astro')

  it('describes the current role', () => {
    expect(content).toContain('Workflows')
    expect(content).toContain('Contentful')
    expect(content).toContain('part-time CPO')
  })

  it('covers the AI platform year', () => {
    expect(content).toContain('semantic')
    expect(content).toContain('vector')
  })

  it('mentions the civil engineering background', () => {
    expect(content).toContain('civil engineer')
    expect(content).toContain('City of Bulawayo')
  })

  it('links to Notto, the CV and unoffice hours', () => {
    expect(content).toContain('https://nottoafrica.com')
    expect(content).toContain('href="/cv"')
    expect(content).toContain('href="/unoffice-hours"')
  })
})

describe('CV page', () => {
  const content = readSource('pages/cv.astro')

  it('shows the current title', () => {
    expect(content).toContain('Senior Software Engineer')
    expect(content).toContain('AI and distributed systems')
  })

  it('has the NUST education entry', () => {
    expect(content).toContain('National University of Science and Technology')
    expect(content).toContain('NUST')
  })

  it.each(['Contentful', 'Notto Africa', 'Anaplan', 'Sigma Digital'])('has the %s entry', (org) => {
    expect(content).toContain(`org: "${org}"`)
  })

  it('keeps the pre-software history', () => {
    expect(content).toContain('Esri South Africa')
    expect(content).toContain('RAMM Technologies')
    expect(content).toContain('City of Bulawayo')
  })

  it('lists the independent products', () => {
    expect(content).toContain('https://blah.chat')
    expect(content).toContain('https://www.easydeck.app')
    expect(content).toContain('https://mxr.sh')
  })

  it('has the skills section', () => {
    expect(content).toContain('TypeScript')
    expect(content).toContain('vector databases')
    expect(content).toContain('AWS')
  })
})

describe('Footer', () => {
  const content = readSource('components/Footer.astro')

  it.each([
    ['mxr', 'https://mxr.sh'],
    ['spotuify', 'https://spotuify.app'],
    ['Worth Your Time', 'https://worthyourtime.xyz'],
    ['blah.chat', 'https://blah.chat/'],
    ['FaithBench', 'https://faithbench.com/'],
  ])('lists %s', (label, href) => {
    expect(content).toContain(`{ label: "${label}", href: "${href}" }`)
  })

  it('does not list Pro-search', () => {
    expect(content.toLowerCase()).not.toContain('pro-search')
    expect(content.toLowerCase()).not.toContain('prosearch')
  })

  it('links the newsletter and unoffice hours', () => {
    expect(content).toContain('justreflections.bhekani.com')
    expect(content).toContain('/unoffice-hours')
  })
})
