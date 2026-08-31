---
version: "1.0"
name: PitchClass
description: Cyberpunk / Neon Dark Design System for Thai Teacher Por-Por-5 App
colors:
  bg-base: "#030305"
  bg-surface: "#0a0b12"
  bg-surface-hover: "#131420"
  bg-tertiary: "rgba(6, 182, 212, 0.05)"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted: "#475569"
  border-subtle: "rgba(6, 182, 212, 0.15)"
  border-strong: "rgba(236, 72, 153, 0.4)"
  accent-cyan: "#06b6d4"
  accent-cyan-dim: "rgba(6, 182, 212, 0.15)"
  accent-purple: "#ec4899"
  accent-purple-dim: "rgba(236, 72, 153, 0.15)"
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
    fontWeight: 700
  h2:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
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
    backgroundColor: "{colors.accent-cyan}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  btn-outline:
    backgroundColor: "transparent"
    textColor: "{colors.accent-cyan}"
    border: "1px solid {colors.accent-cyan}"
    rounded: "{rounded.md}"
---

## Overview

PitchClass uses a **Cyberpunk / Neon Dark** aesthetic. The goal is to make a traditionally boring bureaucratic task (grading and attendance) feel modern, responsive, and almost game-like.

The UI leverages deep black/purple backgrounds with sharp neon cyan and pink accents for high-contrast visibility.

## Colors

- **Base Background:** Deep void (`#030305`) to create depth and contrast.
- **Surface:** Slightly elevated dark card (`#0a0b12`) for content containers.
- **Accent Cyan:** The primary interactive color (`#06b6d4`). Used for primary buttons, active tabs, and positive trends.
- **Accent Pink/Purple:** The secondary interactive color (`#ec4899`). Used for highlights, active borders, and warnings.
- **Borders:** Translucent versions of the accent colors (`rgba(6, 182, 212, 0.15)`) to create a "glass" or "holographic" feel without overwhelming the content.

## Typography

- **English (Primary):** `Outfit` — A modern, geometric sans-serif that fits the tech/cyber aesthetic.
- **Thai (Fallback):** `Sarabun` — The official Thai government font, required for official reports but used here in a modern context.

## Layout & Spacing

- **Sidebar:** Fixed at `260px` width.
- **Main Content:** Flexes to fill remaining space, with a max-width container for readability on ultra-wide screens.
- **Bento Grid:** The dashboard and complex forms use a Bento-style grid with 1px `border-subtle` separators to create a "hud" (Heads Up Display) feel.

## Do's and Don'ts

- **Do** use `accent-cyan` for primary calls to action.
- **Don't** use pure white (`#ffffff`) for text; always use `text-primary` (`#f8fafc`) to reduce eye strain on dark backgrounds.
- **Do** use `rgba` for borders to allow underlying gradients/backgrounds to subtly bleed through.
- **Don't** use solid gray borders. All borders should have a slight cyan or pink tint to maintain the neon aesthetic.
