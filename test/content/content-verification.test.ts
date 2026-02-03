import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, '../../src', relativePath), 'utf-8')
}

describe('AboutCard component', () => {
  const content = readSource('components/AboutCard.astro')

  it('shows correct job title', () => {
    expect(content).toContain('Senior AI Software Engineer')
  })

  it('shows correct employer', () => {
    expect(content).toContain('Contentful')
  })

  it('describes role accurately', () => {
    expect(content).toContain('vector DBs, pipelines, and search APIs')
  })

  it('mentions indie builder', () => {
    expect(content).toContain('Indie builder')
  })
})

describe('Homepage', () => {
  const content = readSource('pages/index.astro')

  it('lists FaithBench project', () => {
    expect(content).toContain('FaithBench')
    expect(content).toContain('https://faithbench.com/')
  })

  it('lists blah.chat project', () => {
    expect(content).toContain('blah.chat')
    expect(content).toContain('https://blah.chat/')
  })

  it('lists CV Optimiser project', () => {
    expect(content).toContain('CV Optimiser')
    expect(content).toContain('https://www.cvoptimiser.com')
  })

  it('lists EasyDeck project', () => {
    expect(content).toContain('EasyDeck')
    expect(content).toContain('https://www.easydeck.app')
  })

  it('lists VidPulse project', () => {
    expect(content).toContain('VidPulse')
    expect(content).toContain('vidpulse')
  })

  it('does not list Pro-search', () => {
    expect(content.toLowerCase()).not.toContain('pro-search')
    expect(content.toLowerCase()).not.toContain('prosearch')
  })

  it('has newsletter CTA with subscribe link instead of iframe', () => {
    expect(content).toContain('Just Reflections')
    expect(content).toContain('Subscribe')
    expect(content).toContain('https://justreflections.bhekani.com/')
    expect(content).not.toContain('<iframe')
  })
})

describe('About page', () => {
  const content = readSource('pages/about.astro')

  it('shows correct role description', () => {
    expect(content).toContain('Senior AI Software Engineer')
  })

  it('mentions Contentful employer', () => {
    expect(content).toContain('Contentful')
  })

  it('describes semantic infrastructure work', () => {
    expect(content).toContain('semantic')
    expect(content).toContain('vector')
  })

  it('mentions civil engineering background', () => {
    expect(content).toContain('civil engineer')
  })

  it('links to CV page', () => {
    expect(content).toContain('href="/cv"')
  })
})

describe('CV page', () => {
  const content = readSource('pages/cv.astro')

  it('shows correct job title', () => {
    expect(content).toContain('Senior AI Software Engineer')
  })

  it('has NUST education entry', () => {
    expect(content).toContain('National University of Science and Technology')
    expect(content).toContain('NUST')
  })

  it('has Contentful experience entries', () => {
    expect(content).toContain('Contentful, London')
  })

  it('has Anaplan experience entry', () => {
    expect(content).toContain('Anaplan')
  })

  it('has ESRI experience entry', () => {
    expect(content).toContain('ESRI South Africa')
  })

  it('has civil engineering entry', () => {
    expect(content).toContain('Civil Engineer')
    expect(content).toContain('City of Bulawayo')
  })

  it('has Sigma Digital entry', () => {
    expect(content).toContain('Sigma Digital')
  })

  it('has GIS Analyst entry', () => {
    expect(content).toContain('GIS Analyst')
    expect(content).toContain('RAMM Technologies')
  })

  it('has skills section with relevant technologies', () => {
    expect(content).toContain('TypeScript')
    expect(content).toContain('Vector databases')
    expect(content).toContain('AWS')
  })
})

describe('Footer', () => {
  const content = readSource('components/Footer.astro')

  it('lists FaithBench project', () => {
    expect(content).toContain('FaithBench')
  })

  it('lists blah.chat project', () => {
    expect(content).toContain('blah.chat')
  })

  it('lists CV Optimiser project', () => {
    expect(content).toContain('CV Optimiser')
  })

  it('lists Dealbase Africa project', () => {
    expect(content).toContain('Dealbase Africa')
  })

  it('does not list Pro-search', () => {
    expect(content.toLowerCase()).not.toContain('pro-search')
    expect(content.toLowerCase()).not.toContain('prosearch')
  })

  it('has newsletter link', () => {
    expect(content).toContain('Newsletter')
    expect(content).toContain('justreflections.bhekani.com')
  })
})
