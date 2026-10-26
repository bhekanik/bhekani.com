/**
 * Utilities for converting MDX post content to the Markdown exports.
 *
 * Transformations are selected from the MDX syntax tree but applied by source
 * range. Text outside actual MDX nodes, including fenced and inline code,
 * remains byte-for-byte authored.
 */
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx"
import type { MdxjsEsm } from "mdast-util-mdxjs-esm"
import type { BlockContent, DefinitionContent, PhrasingContent, RootContent } from "mdast"
import remarkMdx from "remark-mdx"
import remarkParse from "remark-parse"
import { unified } from "unified"

type MdxElement = MdxJsxFlowElement | MdxJsxTextElement
type MdxNode = MdxElement | MdxjsEsm
type MdxTreeNode = RootContent | BlockContent | DefinitionContent | PhrasingContent

type Replacement = {
  start: number
  end: number
  value: string
}

const mdxParser = unified().use(remarkParse).use(remarkMdx)

const collectMdxNodes = (nodes: readonly MdxTreeNode[]): MdxNode[] =>
  nodes.flatMap((node) => {
    switch (node.type) {
      case "mdxjsEsm":
        return [node]
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement":
        return [node, ...collectMdxNodes(node.children)]
      default:
        return "children" in node ? collectMdxNodes(node.children) : []
    }
  })

const getAttribute = (element: MdxElement, name: string): MdxJsxAttribute | undefined =>
  element.attributes.find(
    (attribute): attribute is MdxJsxAttribute =>
      attribute.type === "mdxJsxAttribute" && attribute.name === name,
  )

const getStaticAttributeValue = (attribute: MdxJsxAttribute | undefined): string | undefined => {
  if (!attribute || attribute.value === null || attribute.value === undefined) return undefined
  if (!(attribute.value instanceof Object)) return attribute.value

  const statement = attribute.value.data?.estree?.body[0]
  if (
    statement?.type !== "ExpressionStatement" ||
    statement.expression.type !== "TemplateLiteral" ||
    statement.expression.expressions.length > 0
  ) {
    return undefined
  }

  return statement.expression.quasis
    .map((quasi) => quasi.value.cooked ?? quasi.value.raw)
    .join("")
}

const getNodeOffsets = (node: MdxNode): { start: number; end: number } | undefined => {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  return start === undefined || end === undefined ? undefined : { start, end }
}

const toBlockquote = (quote: string, reference: string | undefined): string => {
  const lines = quote
    .split("\n")
    .map((line) => `> ${line.trim()}`)
    .filter((line) => line !== "> ")
  return reference ? [...lines, `> — ${reference}`].join("\n") : lines.join("\n")
}

const getWrapperReplacements = (element: MdxElement, offsets: Replacement): Replacement[] => {
  const firstChild = element.children[0]
  const lastChild = element.children.at(-1)
  const start = firstChild?.position?.start.offset
  const end = lastChild?.position?.end.offset
  if (start === undefined || end === undefined) return [{ ...offsets, value: "" }]

  return [
    { start: offsets.start, end: start, value: "" },
    { start: end, end: offsets.end, value: "" },
  ]
}

const isYouTubeUrl = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname
    return hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be"
  } catch {
    return false
  }
}

const getYouTubeUrl = (element: MdxElement): string | undefined => {
  const source = getStaticAttributeValue(getAttribute(element, "src"))
  if (source && isYouTubeUrl(source)) return source

  if (element.name !== "YouTube") return undefined
  const id = getStaticAttributeValue(getAttribute(element, "id")) ?? getStaticAttributeValue(getAttribute(element, "videoId"))
  return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : undefined
}

const getReplacements = (node: MdxNode): Replacement[] => {
  const offsets = getNodeOffsets(node)
  if (!offsets) return []

  if (node.type === "mdxjsEsm") {
    return [{ ...offsets, value: "" }]
  }

  const quote = node.name === "Quote" ? getStaticAttributeValue(getAttribute(node, "quote")) : undefined
  if (quote !== undefined) {
    return [{
      ...offsets,
      value: toBlockquote(quote, getStaticAttributeValue(getAttribute(node, "reference"))),
    }]
  }

  const youtubeUrl = getYouTubeUrl(node)
  if (youtubeUrl) {
    const title = getStaticAttributeValue(getAttribute(node, "title")) ?? "YouTube video"
    return [{ ...offsets, value: `[${title}](${youtubeUrl})` }]
  }

  return getWrapperReplacements(node, { ...offsets, value: "" })
}

/** Convert actual MDX imports and wrappers without modifying authored Markdown. */
export function cleanMdxContent(content: string): string {
  // Some older `.md` posts use literal angle-bracket prose that is valid
  // Markdown but invalid MDX. Leaving those source bytes alone is safer than
  // guessing with a broad HTML regex.
  let nodes: MdxNode[] = []
  try {
    nodes = collectMdxNodes(mdxParser.parse(content).children)
  } catch {
    return content.trim()
  }

  const replacements = nodes.flatMap(getReplacements).sort((left, right) => left.start - right.start)

  let cursor = 0
  let cleaned = ""
  for (const replacement of replacements) {
    if (replacement.start < cursor) continue
    cleaned += `${content.slice(cursor, replacement.start)}${replacement.value}`
    cursor = replacement.end
  }
  cleaned += content.slice(cursor)

  return cleaned.replace(/\n{3,}/g, "\n\n").trim()
}

/** Format a date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] as string
}
