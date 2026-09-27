# Ledger — Design System

The product is a shopkeeper's ledger merged with a chat app: a small business owner's
single source of truth for "who am I talking to, and where do they stand." The
visual language borrows from notebooks and account books, not generic SaaS
dashboards — hairline rules instead of drop shadows, small square corners instead
of rounded cards, and pipeline stages read like tab dividers rather than pills.

## Color

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#EDE9DE` | App canvas background |
| `--panel` | `#FBFAF6` | Cards, inputs, active row |
| `--ink` | `#21261F` | Primary text |
| `--ink-muted` | `#5B5F52` | Secondary text, timestamps |
| `--rule` | `#D4CDB8` | Hairline dividers/borders |
| `--pine` | `#33513F` | Primary action color, outgoing messages |
| `--ochre` | `#B5652D` | Unread badges, hot-lead accents |

Pipeline stage colors: New lead `#7A7E6D` · Contacted `#3D6CA8` · Negotiating
`#B5652D` · Won `#33513F` · Lost `#96473F`.

## Type

- **Display / brand:** Fraunces (variable serif) — used sparingly for the "Ledger"
  wordmark and the customer name in the details panel. Gives the warmth of a
  handwritten ledger heading.
- **Body / UI:** IBM Plex Sans — all interface chrome, messages, and labels.

## Layout

Three-pane app shell, fixed rail widths, fluid center:

```
+------------+--------------------------+--------------+
|  Ledger    |  Customer name           | Customer     |
|  [search]  |  phone                  |  file         |
|  [chips]   +--------------------------+  - stage      |
|------------|                          |  - tags       |
|  contact   |     message thread       |  - notes      |
|  list      |                          |              |
|  ...       +--------------------------+              |
|            |  [quick replies]         |              |
|            |  [composer]              |              |
+------------+--------------------------+--------------+
```

Left-aligned throughout; no centered marketing-style layout, since this is a
working tool, not a landing page.

## Principles

1. **Hairlines over shadows.** Every separation is a 1px `--rule` border, never
   `box-shadow`. It's what gives the ledger/notebook feel instead of a "SaaS card"
   feel.
2. **Small, square corners.** `--radius: 3px` everywhere — enough to soften edges,
   not enough to read as bubbly.
3. **Stage as a dot + label, not a pill.** Consistent with how a ledger marks a
   status in the margin rather than a rounded badge.
4. **Ochre is scarce.** It exists only for things that need attention right now —
   unread counts and the "negotiating" stage — so it stays meaningful.
