import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { ComponentProps } from 'astro/types'

export async function renderComponent<T extends (...args: any) => any>(
  Component: T,
  props?: ComponentProps<T>
) {
  const container = await AstroContainer.create()
  return container.renderToString(Component, { props })
}