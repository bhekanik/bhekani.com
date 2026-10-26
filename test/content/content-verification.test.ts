import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, '../../src', relativePath), 'utf-8')
}

function readProject(name: string) {
  return JSON.parse(readSource(`content/projects/${name}.json`)) as {
    title: string
    description?: string
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

describe('Project facts', () => {
  it.each([
    ['imali', 'imports CSV and PDF bank statements'],
    ['linganisa', 'AI try-on previews'],
    ['cv-optimiser', 'tailors a CV to a specific job description'],
    ['interview-optimiser', 'real-time voice conversations and feedback reports'],
    ['reference-optimiser', 'voice reference interviews with reports'],
    ['journaler', 'historical community platform'],
    ['pro-search', 'Search query builder'],
  ])('%s uses a conservative capability description', (name, description) => {
    expect(readProject(name)).toMatchObject({ description: expect.stringContaining(description) })
  })

  it('does not retain unsupported outcome promises or the stale Dealbase stack label', () => {
    expect(readProject('imali').description).not.toContain('UK bank accounts')
    expect(readProject('linganisa').description).not.toContain('returns')
    expect(readProject('cv-optimiser').description).not.toContain('ATS')
    expect(readProject('reference-optimiser').description).not.toContain('genuine enthusiasm')
    expect(readSource('content/projects/dealbase.json')).toContain('"Drizzle"')
    expect(readSource('content/projects/dealbase.json')).not.toContain('"Prisma"')
  })

  it('keeps FaithBench as a direct link, not a new project record', () => {
    expect(readSource('pages/about.astro')).toContain('https://faithbench.com')
    expect(readSource('pages/cv.astro')).toContain('https://faithbench.com')
    expect(() => readProject('faithbench')).toThrow()
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

  it('projects collection facts for the inventory without changing its direct FaithBench link', () => {
    expect(content).toContain('selectProjectSummaries')
    expect(content).toContain('https://faithbench.com')
  })
})

describe('Micro archive', () => {
  const content = readSource('pages/micro/index.astro')

  it('labels the existing RSS destination as the blog feed', () => {
    expect(content).toContain('Blog RSS')
    expect(content).toContain('This feed contains blog posts')
    expect(content).not.toContain('Subscribe via RSS')
  })

  it('keeps published notes newest first with visible permalink names', () => {
    expect(content).toContain('.filter((micro) => micro.data.published !== false)')
    expect(content).toContain('.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())')
    expect(content).toMatch(/class="permalink">\s*Permalink/)
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

  it('lists the independent products from the collection', () => {
    expect(content).toContain('selectProjectSummaries(allProjects, ["blah-chat", "easydeck", "mxr"])')
  })

  it('projects its detailed products from the collection', () => {
    expect(content).toContain('selectProjectSummaries')
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
