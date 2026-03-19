# Design System Specification: Editorial Precision

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Monolith"**

This design system is built on the principles of high-end editorial layouts and brutalist structural integrity. It rejects the "templated" look of modern SaaS in favor of a bespoke, developer-focused aesthetic that feels both authoritative and airy. 

The system moves beyond standard UI by leveraging **intentional asymmetry** and **exaggerated typography scales**. By treating the screen as a canvas rather than a grid of boxes, we create an environment where white space is an active design element, not just a gap between components. We break the "Standard UI" mold by replacing traditional structural lines with shifts in tonal depth and sophisticated, oversized type that demands attention.

---

## 2. Colors: High-Contrast Monochromatism
The palette is rooted in a stark, professional black-and-white foundation, utilizing shades of grey (`#5e5e5e`, `#ababab`) only to denote secondary hierarchy or interactive states.

### The Palette
*   **Primary (`#000000`)**: Used for high-impact typography and primary action states.
*   **Background (`#f9f9f9`)**: A slightly off-white base that reduces eye strain while maintaining a high-end feel.
*   **On-Surface (`#1a1c1c`)**: The standard for body copy, ensuring maximum legibility.

### Surface Hierarchy & The "No-Line" Rule
To achieve a premium feel, **do not use 1px solid borders for sectioning.** 
*   **The Rule:** Boundaries must be defined through background color shifts. Use `surface_container_low` (`#f3f3f4`) to define a section against a `surface` background.
*   **Nesting:** Create depth by stacking. Place a card using `surface_container_lowest` (`#ffffff`) on top of a `surface_container` (`#eeeeee`) section. This "paper-on-paper" layering provides structural clarity without visual clutter.

### Signature Textures
While the system is high-contrast, use a subtle gradient transition from `primary` (#000000) to `primary_container` (#3b3b3b) for large-scale CTA backgrounds or hero sections. This adds a "physical" soul to the digital space, mimicking the ink density of high-end print.

---

## 3. Typography: The Space Grotesk Authority
Typography is the primary driver of this system's identity. We utilize **Space Grotesk** for structural impact and **Inter** for technical precision.

*   **Display LG (`3.5rem`, Space Grotesk)**: Used for hero statements. Tight letter-spacing (-0.02em) and all-caps styling are encouraged for a "monolithic" look.
*   **Headline SM/MD (`1.5rem` - `1.75rem`, Space Grotesk)**: Used for section headers. These should feel oversized compared to the body text to establish a clear editorial hierarchy.
*   **Body MD (`0.875rem`, Inter)**: The workhorse for technical documentation and descriptions. The contrast between the massive headlines and the refined body text creates the "Modern Developer" vibe.
*   **Label SM (`0.6875rem`, Inter)**: Used for micro-data, tags, and form labels. Always uppercase with a slight letter-spacing increase (+0.05em) for a sophisticated, architectural feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are largely prohibited. We convey hierarchy through the **Layering Principle**.

*   **Ambient Shadows:** If a floating element (like a modal) is required, use an extra-diffused shadow.
    *   *Blur:* 40px - 60px.
    *   *Opacity:* 4% of `on_surface`.
    *   *Offset:* Vertical 10px.
*   **The "Ghost Border" Fallback:** For form inputs or cards where containment is strictly required for accessibility, use the `outline_variant` (#c6c6c6) at **15% opacity**. This creates a "hairline" feel that disappears into the layout until focused.
*   **Glassmorphism:** For top navigation or floating action toolbars, use `surface_container_lowest` with a 20px backdrop-blur and 80% opacity. This allows the oversized typography to peek through, maintaining the "Monolith" vibe.

---

## 5. Components: Minimalist Primitives

### Buttons
*   **Primary:** Solid `primary` (#000000) background, `on_primary` (#e2e2e2) text. Use `full` roundedness (9999px) for a "pill" shape that contrasts against the sharp typography.
*   **Secondary:** Outline style. Use the "Ghost Border" (15% `outline`) with `primary` text.
*   **Hover State:** Transition to `primary_container` (#3b3b3b) for solid buttons to provide a subtle "ink-press" feel.

### Form Inputs
*   **Style:** Minimalist outlines using `outline_variant` (#c6c6c6). 
*   **Radius:** `lg` (1rem) for text inputs to match the "pill" button language.
*   **Focus State:** The border transitions to a solid 1px `primary` (#000000). Labels should use `label-md` and be positioned with a generous `spacing.3` (1rem) offset.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines. 
*   **Execution:** Separate list items using `spacing.5` (1.7rem) of vertical white space. For cards, use a shift to `surface_container_low` (#f3f3f4) instead of a border.
*   **Asymmetry:** In grid layouts, occasionally allow a card to span two columns to break the monotonous "Standard SaaS" grid.

### Additional Component: The "Code Block"
Given the developer focus, code blocks should use `surface_container_highest` (#e2e2e2) with a monospaced font, utilizing the `md` (0.75rem) roundedness scale. No borders; just a clean tonal shift.

---

## 6. Do's and Don'ts

### Do:
*   **Use Massive White Space:** Use `spacing.24` (8.5rem) for section margins. Breathing room is a luxury; use it.
*   **Embrace All-Caps:** Use all-caps for `display` and `label` roles to lean into the architectural aesthetic.
*   **Align to the Type:** Align icons and buttons strictly to the baseline or cap-height of the surrounding typography.

### Don't:
*   **Don't use 1px Borders:** Never use a solid grey line to separate sections. Use tonal shifts or white space.
*   **Don't use Vibrant Colors:** This system lives in the grayscale. Reserve `error` (#ba1a1a) strictly for critical system failures.
*   **Don't Crowded the Content:** If a layout feels "busy," increase the spacing scale by two increments. The system is designed to be sparse.
*   **Don't use Standard Shadows:** Avoid the "fuzzy box" look. If it doesn't need to float, keep it flat on the tonal layer.