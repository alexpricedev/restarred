# Legal Pages Implementation — Implementation Spec

## Problem

The site footer (`src/server/components/layouts.tsx`) links to `/privacy` and `/terms`, but neither route is implemented. Clicking these links results in a 404.

## Current State

**Footer links** (in `src/server/components/layouts.tsx`):
```tsx
<a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
<a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
```

**Routes**: Neither `/privacy` nor `/terms` exists in `src/server/routes/app.tsx`.

## Implementation Plan

Follow the standard "Adding a New Page" pattern from `CLAUDE.md`:

### 1. Templates

**Create**: `src/server/templates/terms.tsx`

```tsx
import { Layout } from "../components/layouts";

interface TermsProps {
  lastUpdated: string;
}

export const Terms = ({ lastUpdated }: TermsProps) => (
  <Layout title="Terms of Service" name="terms">
    <article class="legal-page">
      <h1>Terms of Service</h1>
      <p class="legal-meta">Last updated: {lastUpdated}</p>
      {/* Terms content here */}
    </article>
  </Layout>
);
```

**Create**: `src/server/templates/privacy.tsx`

```tsx
import { Layout } from "../components/layouts";

interface PrivacyProps {
  lastUpdated: string;
}

export const Privacy = ({ lastUpdated }: PrivacyProps) => (
  <Layout title="Privacy Policy" name="privacy">
    <article class="legal-page">
      <h1>Privacy Policy</h1>
      <p class="legal-meta">Last updated: {lastUpdated}</p>
      {/* Privacy content here */}
    </article>
  </Layout>
);
```

### 2. Controllers

**Create**: `src/server/controllers/app/terms.tsx`

```tsx
import { render } from "../../utils/response";
import { Terms } from "../../templates/terms";

export const terms = {
  index(_req: Request): Response {
    return render(<Terms lastUpdated="March 2026" />);
  },
};
```

**Create**: `src/server/controllers/app/privacy.tsx`

```tsx
import { render } from "../../utils/response";
import { Privacy } from "../../templates/privacy";

export const privacy = {
  index(_req: Request): Response {
    return render(<Privacy lastUpdated="March 2026" />);
  },
};
```

### 3. Barrel Exports

**Modify**: `src/server/controllers/app/index.ts`

Add:
```tsx
export { terms } from "./terms";
export { privacy } from "./privacy";
```

### 4. Routes

**Modify**: `src/server/routes/app.tsx`

Add:
```tsx
"/terms": terms.index,
"/privacy": privacy.index,
```

### 5. Client CSS

**Create**: `src/client/pages/legal.css`

Shared styles for both legal pages:

```css
.legal-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 24px;
}

.legal-page h1 {
  /* Follow DESIGN.md typography */
}

.legal-page h2 {
  /* Section headers */
}

.legal-page p,
.legal-page li {
  /* Body text — Inter, readable line height */
}

.legal-meta {
  /* "Last updated" date styling */
}
```

Import in the main CSS entry point or via the Layout component's `name` prop routing.

### 6. Content Format

The legal content should be written as JSX directly in the template files. This keeps it:
- Type-safe and version-controlled
- Part of the same build pipeline
- Easy to update with a code change

**Do not** use markdown-to-HTML rendering or load content from external files — keep it simple.

### 7. Page Design

Follow `DESIGN.md`:
- Monochrome greyscale aesthetic
- Space Grotesk for headings, Inter for body text
- Generous white space
- No accent colours (except error red #ba1a1a if needed)
- No 1px borders — use tonal shifts for section separation

The legal pages should be clean, readable, and uncluttered. Long-form text with clear section headings.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/server/templates/terms.tsx` | Create |
| `src/server/templates/privacy.tsx` | Create |
| `src/server/controllers/app/terms.tsx` | Create |
| `src/server/controllers/app/privacy.tsx` | Create |
| `src/server/controllers/app/index.ts` | Modify — add exports |
| `src/server/routes/app.tsx` | Modify — add routes |
| `src/client/pages/legal.css` | Create — shared legal page styles |

## Testing

**Create**: `src/server/controllers/app/terms.test.ts`
- Test that GET `/terms` returns 200 with HTML content
- Test that "Terms of Service" appears in the rendered HTML
- Test that "INFINITE CHAPTERS LTD" appears in the content
- Test that "Last updated" date is present

**Create**: `src/server/controllers/app/privacy.test.ts`
- Test that GET `/privacy` returns 200 with HTML content
- Test that "Privacy Policy" appears in the rendered HTML
- Test that data collection sections are present
- Test that third-party services are listed

## Considerations

- These pages should be accessible **without authentication** (guest users need to read them before signing up)
- The footer links currently use `target="_blank"` — legal pages open in a new tab, which is fine
- Consider adding a table of contents for longer documents
- The `lastUpdated` date should be updated whenever the content changes materially

## Dependencies

- The actual content for these pages comes from:
  - `specs/legal/01-terms-of-service.md` (terms content spec)
  - `specs/legal/02-privacy-policy.md` (privacy content spec)
- Content should be reviewed by a solicitor before going live
