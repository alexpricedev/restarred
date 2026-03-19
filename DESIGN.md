# Design System — Restarred

## Product Context
- **What this is:** A microservice that emails developers 3 forgotten GitHub stars every week, so good repos don't disappear into the void.
- **Who it's for:** Developers who star repos on GitHub and forget about them. Developer-friendly, minimal, slightly dry humour tone.
- **Space/industry:** Developer tools, GitHub ecosystem, email digests. Peers: GitHub Explore, daily.dev, Changelog Nightly.
- **Project type:** Web app (landing page + authenticated account dashboard) + transactional email digest.

## Branding
- **Name:** restarred
- **Logo lockup:** `re:` as the mark, `starred` as the wordmark — **re:**starred
- **Concept:** Plays on "re-starred" (revisiting your stars) and "re: starred" (like an email subject line). The `re:` prefix reinforces the email-native nature.
- **Tone:** Developer-friendly, minimal, slightly dry humour. Not corporate.

## Aesthetic Direction
- **Direction:** Editorial / Architectural Monolith
- **Decoration level:** Intentional — tonal layering, gradient CTA backgrounds, glassmorphism nav
- **Mood:** High-end editorial meets brutalist structural integrity. Treats the screen as a canvas — white space is an active design element. Rejects the "templated SaaS" look in favour of a bespoke, developer-focused aesthetic that feels both authoritative and airy.
- **Reference sites:** Mock-up in `design/mock-up.png`

## Typography
- **Display/Hero:** Space Grotesk 700 — structural impact, tight letter-spacing (-0.02em), all-caps for the "monolithic" look. The primary identity driver.
- **Body:** Inter 400/500 — technical precision for body copy and descriptions. The contrast between massive display type and refined body text creates the "Modern Developer" feel.
- **UI/Labels:** Inter 600 — uppercase with +0.05em letter-spacing for a sophisticated architectural feel. Used at 0.6875rem for micro-data, tags, form labels.
- **Data/Tables:** Inter (tabular-nums) — same body font, tabular figures for aligned numbers.
- **Code:** JetBrains Mono 400
- **Loading:** Google Fonts — `Space+Grotesk:wght@400;500;600;700` and `Inter:wght@400;500;600`
- **Scale:**
  - Display LG: 3.5rem (56px) — hero statements
  - Display MD: 2.5rem (40px) — secondary hero
  - Headline MD: 1.75rem (28px) — section headers
  - Headline SM: 1.5rem (24px) — subsection headers
  - Title: 1.25rem (20px) — card titles, page titles
  - Body MD: 0.875rem (14px) — standard body text
  - Body SM: 0.8125rem (13px) — secondary body, descriptions
  - Label MD: 0.75rem (12px) — data labels
  - Label SM: 0.6875rem (11px) — micro-data, tags, uppercase labels

## Color
- **Approach:** Restrained — monochrome. The system lives in greyscale. Reserve colour strictly for system error states.
- **Primary:** #000000 — high-impact typography, primary actions, CTA backgrounds
- **Primary Container:** #3b3b3b — hover state for solid buttons ("ink-press" feel), gradient endpoints
- **On Primary:** #e2e2e2 — text on primary backgrounds
- **Neutrals (light to dark):**
  - Surface Lowest: #ffffff — cards floating on containers
  - Surface: #f9f9f9 — page background (slightly off-white, reduces eye strain)
  - Surface Container Low: #f3f3f4 — section backgrounds, card fills
  - Surface Container: #eeeeee — deeper section backgrounds
  - Surface Container High: #e6e6e6 — hover states on surface elements
  - Surface Container Highest: #e2e2e2 — code blocks, highest contrast surface
  - Outline: #c6c6c6 — ghost borders at 15% opacity only
  - On Surface Tertiary: #ababab — tertiary text
  - On Surface Secondary: #5e5e5e — secondary text, descriptions
  - On Surface: #1a1c1c — primary body text, maximum legibility
- **Semantic:** error #ba1a1a — critical system failures only. No success/warning/info colours; the monochrome system handles positive states with tonal shifts.
- **Dark mode:** Invert the surface scale. Primary becomes #e2e2e2, surfaces become dark greys (#0a0a0a through #2e2e2e), maintain the same contrast ratios. Reduce any ambient shadow opacity by 50%.

## Surface Hierarchy — The "No-Line" Rule
- **Do not use 1px solid borders for sectioning.** Boundaries are defined through background colour shifts.
- **Nesting:** Create depth by stacking surfaces. Place `surface_container_lowest` (#ffffff) on `surface_container` (#eeeeee) for "paper-on-paper" layering.
- **Ghost borders:** For form inputs and cards where containment is needed for accessibility, use `outline` (#c6c6c6) at 15% opacity. This creates a "hairline" that disappears into the layout until focused.
- **Glassmorphism:** For sticky nav/toolbars: `surface_container_lowest` with 20px backdrop-blur and 80% opacity.
- **Signature gradient:** `linear-gradient(135deg, #000000, #3b3b3b)` for large-scale CTA backgrounds. Mimics ink density of high-end print.

## Spacing
- **Base unit:** 8px
- **Density:** Spacious — white space is a luxury, use it aggressively
- **Scale:** 2xs(4) xs(8) sm(16) md(24) lg(32) xl(48) 2xl(64) 3xl(96) 4xl(136)
- **Section margins:** Use 4xl (136px / 8.5rem) for major section separation
- **Card padding:** 32–40px internal padding
- **List items:** Separate with md (24px) to xl (48px) vertical white space — no divider lines

## Layout
- **Approach:** Hybrid — grid-disciplined for app pages, creative-editorial for landing/marketing
- **Grid:** Single-column content at 1080px max-width for landing; 960px for app pages
- **Max content width:** 1080px (landing), 960px (app), 480px (body text measure)
- **Border radius:** Hierarchical — sm: 4px (subtle rounding), md: 8px (cards, containers), lg: 16px (form inputs, large cards), full: 9999px (buttons — pill shape contrasts against sharp typography)
- **Asymmetry:** In grid layouts, occasionally allow a card to span two columns to break the "Standard SaaS" grid.

## Elevation & Depth
- **Rule:** No traditional drop shadows. Hierarchy through tonal layering.
- **Ambient shadows (modals/floating only):** blur 40–60px, opacity 4% of on-surface, vertical offset 10px
- **Everything else:** Flat on its tonal layer. If it doesn't float, don't shadow it.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50–100ms) short(150–250ms) medium(250–400ms)
- **Transitions:** Border colour on focus (150ms), background colour on hover (150ms–200ms), opacity for fade-in content (400ms)
- **Prohibited:** Scroll-driven animations, parallax, bouncy easing, decorative loading spinners

## Do's and Don'ts

### Do:
- Use massive white space — 4xl (136px) for section margins
- Embrace all-caps for display and label roles — it's the architectural aesthetic
- Align icons and buttons to baseline or cap-height of surrounding typography
- Use tonal shifts to create section boundaries
- Use the pill shape (border-radius: 9999px) for all interactive buttons

### Don't:
- Use 1px borders to separate sections — use tonal shifts or white space
- Use vibrant/saturated colours — this system lives in greyscale
- Crowd the content — if it feels busy, increase spacing by two increments
- Use standard box shadows — if it doesn't float, keep it flat
- Use purple/violet gradients, coloured circle icons, or uniform bubbly border-radius

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Initial design system codified | Formalised from existing design/DESIGN.md spec and design/mock-up.png into standard DESIGN.md format via /design-consultation |
| 2026-03-19 | Space Grotesk + Inter chosen | Space Grotesk for structural display impact; Inter for body precision. Contrast between scales creates editorial hierarchy. |
| 2026-03-19 | Monochrome palette, no accent colour | Matches "Architectural Monolith" direction. Greyscale keeps focus on typography and content. Error red is the only colour. |
| 2026-03-19 | No-border surface layering | Premium editorial feel. Tonal depth replaces structural lines. Ghost borders at 15% opacity only where accessibility requires containment. |
| 2026-03-19 | Pill-shaped buttons | Contrasts against the sharp, angular typography. Softens interactive elements while display type stays monolithic. |
