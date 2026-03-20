import type React from "react";

import { getAssetUrl } from "../services/assets";
import type { User } from "../services/users";
import { Nav } from "./nav";

const SITE_NAME = "re:starred";
const SITE_URL = process.env.APP_URL as string;
const DEFAULT_DESCRIPTION =
  "3 of your GitHub stars, resurfaced in your inbox every week.";

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

interface MetaProps {
  title: string;
  description?: string;
}

function Meta({ title, description }: MetaProps) {
  const desc = description || DEFAULT_DESCRIPTION;
  return (
    <>
      <meta name="description" content={desc} />
      <meta name="robots" content="index, follow" />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
    </>
  );
}

interface LayoutProps {
  title: string;
  description?: string;
  name: string;
  children: React.ReactNode;
  user?: User | null;
  csrfToken?: string;
}

export function Layout({
  title,
  description,
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
        <Meta title={title} description={description} />
        <GoogleFonts />
        <link rel="stylesheet" href={getAssetUrl("/assets/main.css")} />
      </head>
      <body data-page={name} data-component="layout">
        <header>
          <div className="header-inner">
            <a href="/" className="wordmark">
              re:starred
            </a>
            <Nav page={name} user={user} csrfToken={csrfToken} />
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms
          </a>
          <a
            href="https://github.com/restarred"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span>&copy; {new Date().getFullYear()} INFINITE CHAPTERS LTD</span>
        </footer>
        <script type="module" src={getAssetUrl("/assets/main.js")} />
      </body>
    </html>
  );
}
