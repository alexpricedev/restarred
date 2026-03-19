import type React from "react";

import { getAssetUrl } from "../services/assets";
import type { User } from "../services/users";
import { Nav } from "./nav";

const SITE_URL = "http://localhost";
const SITE_DESCRIPTION =
  "GitHub Star Rediscovery. 3 random repos, every week, in your inbox.";

const GoogleFonts = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </>
);

interface LayoutProps {
  title: string;
  name: string;
  children: React.ReactNode;
  user?: User | null;
  csrfToken?: string;
}

export function Layout({
  title,
  name,
  children,
  user,
  csrfToken,
}: LayoutProps) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>{title}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
        <GoogleFonts />
        <link rel="stylesheet" href={getAssetUrl("/assets/main.css")} />
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                preact: "https://esm.sh/preact@10.28.4",
                "preact/hooks": "https://esm.sh/preact@10.28.4/hooks",
                "preact/jsx-dev-runtime":
                  "https://esm.sh/preact@10.28.4/jsx-dev-runtime",
                "preact/jsx-runtime":
                  "https://esm.sh/preact@10.28.4/jsx-runtime",
              },
            }),
          }}
        />
      </head>
      <body data-page={name} data-component="layout">
        <header>
          <a href="/" className="logo">
            <span>restarred</span>
          </a>
          <Nav page={name} user={user} csrfToken={csrfToken} />
        </header>
        <main>{children}</main>
        <footer />
        <script type="module" src={getAssetUrl("/assets/main.js")} />
      </body>
    </html>
  );
}

interface BaseLayoutProps {
  title: string;
  name?: string;
  children: React.ReactNode;
}

export function BaseLayout({ title, name, children }: BaseLayoutProps) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>{title}</title>
        <GoogleFonts />
        <link rel="stylesheet" href={getAssetUrl("/assets/main.css")} />
      </head>
      <body data-page={name}>
        {children}
        <script type="module" src={getAssetUrl("/assets/main.js")} />
      </body>
    </html>
  );
}
