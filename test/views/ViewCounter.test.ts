import { getByText, queryByLabelText } from "@testing-library/dom"
import { mount, tick, unmount } from "svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import ViewCounter from "../../src/components/ViewCounter.svelte"

const originalFetch = globalThis.fetch

function deferred<T>() {
  let resolve!: (value: T) => void
  return { promise: new Promise<T>((done) => { resolve = done }), resolve }
}

describe("ViewCounter", () => {
  const targets: HTMLDivElement[] = []
  const components: ReturnType<typeof mount>[] = []

  afterEach(() => {
    globalThis.fetch = originalFetch
    for (const component of components.splice(0)) unmount(component)
    for (const target of targets.splice(0)) target.remove()
  })

  function render() {
    const target = document.createElement("div")
    document.body.append(target)
    targets.push(target)
    const component = mount(ViewCounter, { target, props: { slug: "published-post" } })
    components.push(component)
    return { target, component }
  }

  async function settle() {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await tick()
  }

  it("shows a true zero rather than treating it as an empty result", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: 0 }), { status: 200 }))
    const { target } = render()
    await tick()
    await settle()

    expect(getByText(target, "0 views")).toBeInTheDocument()
  })

  it.each([
    new Response("", { status: 503 }),
    new Response("", { status: 429 }),
    new Response("not json", { status: 200 }),
    new Response("null", { status: 200 }),
    new Response(JSON.stringify({ count: "2" }), { status: 200 }),
    new Response(JSON.stringify({ count: -1 }), { status: 200 }),
  ])("shows an unavailable status for failed or invalid responses", async (response) => {
    globalThis.fetch = vi.fn().mockResolvedValue(response)
    const { target } = render()
    await tick()
    await settle()

    expect(queryByLabelText(target, "View count unavailable")).toBeInTheDocument()
  })

  it("owns the request and aborts it on unmount without accepting its obsolete result", async () => {
    const request = deferred<Response>()
    let signal: AbortSignal | undefined
    globalThis.fetch = (_input, init) => {
      signal = init?.signal ?? undefined
      return request.promise
    }
    const { target, component } = render()
    await tick()

    unmount(component)
    components.splice(components.indexOf(component), 1)
    expect(signal?.aborted).toBe(true)

    request.resolve(new Response(JSON.stringify({ count: 9 }), { status: 200 }))
    await settle()
    expect(target.textContent).not.toContain("9 views")
  })
})
