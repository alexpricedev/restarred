import { DigestPreview } from "@server/components/digest-preview";
import { Flash } from "@server/components/flash";
import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface HomeProps {
  user: User | null;
  csrfToken?: string;
  flash?: { type: "success" | "error"; message: string };
}

export const Home = ({ user, csrfToken, flash }: HomeProps) => (
  <Layout
    title="re:starred — A free weekly email for your forgotten GitHub stars"
    name="home"
    user={user}
    csrfToken={csrfToken}
  >
    <div className="landing-main">
      {flash && (
        <div className="landing-container landing-flash">
          <Flash type={flash.type}>{flash.message}</Flash>
        </div>
      )}
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-container">
          <span className="hero-badge">FREE FOREVER</span>
          <h1 className="hero-heading">
            RESURFACE YOUR
            <br />
            FORGOTTEN STARS
          </h1>
          <div className="hero-grid">
            <div className="hero-description">
              <p>
                A weekly email with 3 GitHub repos you starred and forgot about.
              </p>
            </div>
            {!user && (
              <div className="hero-actions">
                <a href="/auth/github" className="hero-cta">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  CONNECT GITHUB
                </a>
                <p className="hero-proof">
                  NO SIGNUP FORM. NO ADS. ONE EMAIL A WEEK.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Digest Preview */}
      <section className="landing-hero-image">
        <div className="landing-container">
          <DigestPreview />
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-protocol" id="how-it-works">
        <div className="landing-container">
          <div className="protocol-header">
            <h2>HOW IT WORKS</h2>
          </div>
          <div className="protocol-grid">
            <div className="protocol-step">
              <div className="step-number">01</div>
              <h3>CONNECT YOUR GITHUB</h3>
              <p>
                We pull in every repo you've ever starred. No duplicates until
                you've seen them all.
              </p>
            </div>
            <div className="protocol-step">
              <div className="step-number">02</div>
              <h3>GET 3 REPOS, WEEKLY</h3>
              <p>
                Each week, you get 3 of your starred repos in a single email. No
                repeats until you've seen them all.
              </p>
            </div>
            <div className="protocol-step">
              <div className="step-number">03</div>
              <h3>REVISIT WHAT'S WORTH KEEPING</h3>
              <p>
                See what's changed — activity status, latest commits, star
                count. Revisit the ones worth keeping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="landing-bento" id="features">
        <div className="landing-container">
          <div className="bento-grid">
            <div className="bento-large">
              <div className="bento-large-content">
                <h3>FULL CONTEXT, NOT JUST LINKS</h3>
                <p>
                  Each repo comes with its description, primary language, star
                  count, and activity status — so you know if it's still alive
                  before you click.
                </p>
              </div>
            </div>
            <div className="bento-stack">
              <div className="bento-dark">
                <h4>NO NOISE.</h4>
                <p>One email. Three repos. No ads, no tracking, no noise.</p>
              </div>
              <div className="bento-grey">
                <h4>OPEN SOURCE.</h4>
                <p>
                  Proudly open source. Read-only access to public stars. Your
                  data is never sold or used for training.
                </p>
                <a
                  href="https://github.com/alexpricedev/restarred"
                  className="bento-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          {user ? (
            <>
              <h2>YOUR STARS AWAIT</h2>
              <div className="cta-buttons">
                <a href="/account" className="cta-primary">
                  VIEW YOUR ACCOUNT
                </a>
              </div>
            </>
          ) : (
            <>
              <h2>YOUR STARS ARE WAITING</h2>
              <div className="cta-buttons">
                <a href="/auth/github" className="cta-primary">
                  CONNECT GITHUB NOW
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  </Layout>
);
