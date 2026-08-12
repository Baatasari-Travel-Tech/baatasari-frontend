// Types + helpers for the canvas builder playground. Purely client-side —
// no persistence, no backend. See lib/recruitment.ts for the sibling
// "schema + helpers" pattern this mirrors — the field_* block types below
// are the same short_text/paragraph/single_choice/multi_choice/dropdown/link
// field types from that recruitment-form schema, brought in as placeable
// canvas blocks (visual only here — no real form data/submission tied to
// them, this canvas has no backend).
//
// Positioning is plain pixels on a fixed-size canvas (not a column/row
// grid) — a percentage-of-container grid meant float math (canvasWidth/12)
// had to stay perfectly in sync with the rendered container on every
// resize, which is exactly the kind of thing that quietly drifts by a
// sub-pixel and causes stray scrollbars / blocks that don't land where
// dropped. Fixed pixel canvas removes that entire class of bug.

export type BlockType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "quote"
  | "button"
  | "badge"
  | "divider"
  | "card"
  | "image"
  | "field_short_text"
  | "field_paragraph"
  | "field_single_choice"
  | "field_multi_choice"
  | "field_dropdown"
  | "field_link"

export type Block = {
  id: string
  type: BlockType
  x: number
  y: number
  width: number
  height: number
  text: string
  bg: string | null
  color: string | null
  /** Image src for "image", link URL for "field_link". */
  src: string | null
  /** Choices for field_single_choice / field_multi_choice / field_dropdown. */
  options: string[]
  /** Only meaningful for "card" — nested blocks rendered inside it. */
  children: Block[]
}

/** Fixed authoring width of the canvas, in px. The canvas area scrolls
 * horizontally if the viewport is narrower — same model as a real design
 * tool canvas, not a fluid/responsive one. */
export const CANVAS_WIDTH = 1120
export const MIN_BLOCK_WIDTH = 40
export const MIN_BLOCK_HEIGHT = 24

export const CHOICE_FIELD_TYPES = new Set<BlockType>(["field_single_choice", "field_multi_choice", "field_dropdown"])

// Added via the "+ Add block" palette (click to append) or inside a card's
// mini palette. Images are added separately, from the image picker, since
// they need a source picked first. `group` just splits the sidebar into two
// labeled sections — "content" blocks and recruitment-style "field" blocks.
export const BLOCK_LIBRARY: {
  type: Exclude<BlockType, "image">
  label: string
  width: number
  height: number
  group: "content" | "field"
}[] = [
  { type: "heading", label: "Heading", width: 480, height: 64, group: "content" },
  { type: "subheading", label: "Subheading", width: 480, height: 40, group: "content" },
  { type: "paragraph", label: "Paragraph", width: 480, height: 110, group: "content" },
  { type: "quote", label: "Quote", width: 480, height: 100, group: "content" },
  { type: "button", label: "Button", width: 160, height: 48, group: "content" },
  { type: "badge", label: "Badge", width: 110, height: 32, group: "content" },
  { type: "divider", label: "Divider", width: CANVAS_WIDTH - 80, height: 8, group: "content" },
  { type: "card", label: "Card", width: 480, height: 320, group: "content" },
  { type: "field_short_text", label: "Short answer", width: 400, height: 90, group: "field" },
  { type: "field_paragraph", label: "Paragraph answer", width: 400, height: 150, group: "field" },
  { type: "field_single_choice", label: "Single choice", width: 400, height: 170, group: "field" },
  { type: "field_multi_choice", label: "Checkboxes", width: 400, height: 170, group: "field" },
  { type: "field_dropdown", label: "Dropdown", width: 400, height: 90, group: "field" },
  { type: "field_link", label: "Link", width: 320, height: 56, group: "field" },
]

const DEFAULT_TEXT: Record<BlockType, string> = {
  heading: "Heading",
  subheading: "Subheading",
  paragraph: "Write something…",
  quote: "A short quote goes here.",
  button: "Button",
  badge: "Badge",
  divider: "",
  card: "",
  image: "",
  field_short_text: "Short answer question",
  field_paragraph: "Paragraph question",
  field_single_choice: "Single choice question",
  field_multi_choice: "Checkboxes question",
  field_dropdown: "Dropdown question",
  field_link: "Link text",
}

// Curated swatches — brand palette first, then a few vivid extras so the
// canvas doesn't feel locked to one mood.
export const BG_SWATCHES = [
  "#0c1D37", // brand navy
  "#1f4fd8", // royal blue
  "#c2962e", // gold
  "#f5efe4", // cream
  "#ffffff",
  "#eee9ff", // soft purple
  "#dcfce7", // soft green
  "#ffe4e6", // soft rose
]

export const TEXT_SWATCHES = ["#0c1D37", "#ffffff", "#1f4fd8", "#c2962e", "#6b5ce7", "#334155"]

export function uid(prefix = "b"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function newBlock(type: Exclude<BlockType, "image">, x: number, y: number): Block {
  const meta = BLOCK_LIBRARY.find((b) => b.type === type)!
  return {
    id: uid(),
    type,
    x,
    y,
    width: meta.width,
    height: meta.height,
    text: DEFAULT_TEXT[type],
    bg: type === "card" ? "#ffffff" : type === "button" ? "#0c1D37" : type === "divider" ? "#cbd5e1" : null,
    color: type === "button" ? "#ffffff" : null,
    src: null,
    options: CHOICE_FIELD_TYPES.has(type) ? ["Option 1", "Option 2"] : [],
    children: [],
  }
}

export function newImageBlock(src: string, x: number, y: number): Block {
  return {
    id: uid(),
    type: "image",
    x,
    y,
    width: 320,
    height: 240,
    text: "",
    bg: null,
    color: null,
    src,
    options: [],
    children: [],
  }
}

/** Next free y at the bottom of the block list — used for click-to-append. */
export function nextFreeY(blocks: Block[]): number {
  return blocks.reduce((max, b) => Math.max(max, b.y + b.height), 0)
}

export function clampX(x: number, width: number): number {
  return Math.min(Math.max(x, 0), Math.max(0, CANVAS_WIDTH - width))
}
