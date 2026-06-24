---
name: Premium UI / Micro-Interaction Skill
description: Enforces modern, Apple/Vercel-like premium aesthetics, white-space, accessible icons, and smooth transform/opacity micro-interactions.
---

# Premium UI & Micro-Interaction Guidelines

## 1. Core Aesthetics (Apple/Vercel Style)
- **White-space is King:** Use generous padding and margins to let UI elements breathe. Avoid cluttered interfaces.
- **Color Palette:** Avoid harsh primary colors (pure red, pure blue, pure green). Use tailored HSL palettes, subtle gradients, and sophisticated dark modes if applicable.
- **Typography:** Rely on modern geometric sans-serif fonts (e.g., Inter, Roboto). Ensure excellent readability through proper line heights and font weights.
- **Borders & Shadows:** Use smooth, rounded corners (e.g., `border-radius: 8px` to `12px` or `16px`). Apply soft, diffused shadows to create depth, avoiding harsh black dropshadows.

## 2. Micro-Interactions (Crystal #002)
- **CSS Properties:** Animate ONLY `transform` and `opacity`. DO NOT animate layout-triggering properties like `width`, `height`, `margin`, or `padding` to prevent layout thrashing.
- **Transitions:** Keep animations snappy yet smooth (e.g., `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Hover/Active States:** Ensure every interactive element (button, card) has a distinct hover and active (click) state.

## 3. Impeccable Accessibility (Crystal #003)
- **Semantic HTML:** Use proper tags (`<button>`, `<a>`, `<nav>`, `<main>`).
- **Aria Labels:** Icon-only buttons MUST have `aria-label` attributes describing their function.
- **Focus Outlines:** Do not remove focus outlines completely; style them to match the premium aesthetic.
