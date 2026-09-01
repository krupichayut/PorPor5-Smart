---
version: "2.0"
name: PitchClass Minimal
description: Minimalist Dark / Vercel Style Design System for Thai Teacher Por-Por-5 App
colors:
  bg-base: "#000000"
  bg-surface: "#0a0a0a"
  bg-surface-hover: "#171717"
  bg-tertiary: "#1a1a1a"
  text-primary: "#ededed"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  border-subtle: "#27272a"
  border-strong: "#3f3f46"
  accent-cyan: "#ededed"
  accent-cyan-dim: "rgba(255, 255, 255, 0.1)"
  accent-purple: "#a1a1aa"
  accent-purple-dim: "rgba(255, 255, 255, 0.05)"
  danger: "#ef4444"
  success: "#10b981"
  warning: "#f59e0b"
typography:
  font-sans:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontWeight: 400
  h1:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
  h2:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  sidebar-width: "260px"
  header-height: "60px"
components:
  btn-primary:
    backgroundColor: "#ededed"
    textColor: "#000000"
    rounded: "{rounded.md}"
  btn-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border-strong}"
    rounded: "{rounded.md}"
---

## Overview

PitchClass uses a **Minimalist Dark / Vercel** aesthetic. The goal is to make a traditionally boring bureaucratic task feel clean, professional, and frictionless.

The UI leverages deep black backgrounds with crisp white text and very subtle borders, maximizing whitespace and removing unnecessary visual noise.

## Colors

- **Base Background:** Pure black (`#000000`) for infinite depth and clean contrast.
- **Surface:** Very dark gray (`#0a0a0a`) for content containers to separate from the background subtly.
- **Accent (Primary):** Crisp white (`#ededed`) for primary actions. No bright neon colors.
- **Borders:** Barely visible grays (`#27272a`) to structure content without cluttering.

## Typography

- **English (Primary):** `Outfit` — A clean, geometric sans-serif.
- **Thai (Fallback):** `Sarabun` — The official Thai government font.
- **Weights:** Use medium (`500`) and semibold (`600`) sparingly. Avoid overly bold text to maintain elegance.

## Layout & Spacing

- **Sidebar:** Fixed at `260px` width.
- **Main Content:** Flexes to fill remaining space. Lots of padding (whitespace) to let content breathe.
- **Bento Grid / Cards:** Soft rounded corners (`6px` to `8px`) and thin 1px borders. No glowing drop-shadows.

## Do's and Don'ts

- **Do** use whitespace to group elements instead of relying heavily on borders or different background colors.
- **Don't** use neon gradients or glowing shadows.
- **Do** use inverted buttons (white background, black text) for primary actions.
- **Don't** use solid bright colors for large areas. Keep color semantic (red for errors, green for success) and use it sparingly.
