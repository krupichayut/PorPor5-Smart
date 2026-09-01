---
version: "3.0"
name: PitchClass Linear / Obsidian Sleek
description: Linear & Vercel Minimalist Dark Design System for Thai Teacher Por-Por-5 App
colors:
  bg-base: "#000000"
  bg-surface: "#0a0a0a"
  bg-surface-elevated: "#111111"
  bg-surface-hover: "#161616"
  bg-tertiary: "#1f1f1f"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  border-subtle: "#1f1f1f"
  border-strong: "#2e2e2e"
  border-focus: "#52525b"
  accent-primary: "#ededed"
  accent-primary-hover: "#ffffff"
  accent-cyan: "#38bdf8"
  accent-purple: "#a855f7"
  danger: "#f43f5e"
  success: "#10b981"
  warning: "#f59e0b"
  info: "#3b82f6"
typography:
  font-sans:
    fontFamily: "'Outfit', 'Sarabun', -apple-system, sans-serif"
    fontWeight: 400
  h1:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
  h2:
    fontFamily: "'Outfit', 'Sarabun', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  sidebar-width: "250px"
  header-height: "56px"
components:
  btn-primary:
    backgroundColor: "#ededed"
    textColor: "#000000"
    rounded: "{rounded.sm}"
  btn-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    border: "1px solid {colors.border-subtle}"
    rounded: "{rounded.sm}"
---

## Overview

PitchClass uses a **Linear / Obsidian Sleek** aesthetic (inspired by Linear.app and Vercel).

The design philosophy focuses on **high readability, zero clutter, and ultra-smooth productivity** for teachers managing student attendance, grading, and Thai official reporting (ปพ.5 & ว PA).

## 1. Core Principles

- **Pure Deep Blacks (`#000000` / `#0A0A0A`):** Eliminates visual fatigue during long grading sessions.
- **1px Hairline Dividers (`#1F1F1F` / `#2E2E2E`):** Clear grid separation without heavy shadows or borders.
- **Soft Pastel Translucent Badges:** Clean attendance status pills (มา/ขาด/ลา/สาย) with legible contrast.
- **Sticky Gradebook Grid:** Student numbering and names stay fixed during horizontal score navigation.
- **Capsule Selectors & Pill Tabs:** Intuitive quick-actions and smooth page switching.
