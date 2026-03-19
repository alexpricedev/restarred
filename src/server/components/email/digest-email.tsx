import type { SelectedRepo } from "../../services/digest-email";
import { EmailFooter } from "./email-footer";
import { RepoCard } from "./repo-card";

interface DigestEmailProps {
  repos: SelectedRepo[];
  accountUrl: string;
  unsubscribeUrl: string;
}

export const DigestEmail = ({
  repos,
  accountUrl,
  unsubscribeUrl,
}: DigestEmailProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="color-scheme" content="light" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <title>re:starred — your weekly digest</title>
    </head>
    <body
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#f9f9f9",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <tr>
          <td style={{ padding: "32px 16px" }} align="center">
            <table
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
              style={{
                maxWidth: "600px",
                width: "100%",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
              }}
            >
              <tr>
                <td style={{ padding: "32px 32px 24px 32px" }}>
                  {/* Header */}
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    role="presentation"
                    style={{
                      marginBottom: "24px",
                      paddingBottom: "20px",
                      borderBottom: "1px solid rgba(198,198,198,0.15)",
                    }}
                  >
                    <tr>
                      <td>
                        <span
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: "20px",
                            color: "#000000",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          re:starred
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          color: "#ababab",
                        }}
                      >
                        Your weekly digest
                      </td>
                    </tr>
                  </table>

                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      color: "#5e5e5e",
                      margin: "0 0 24px",
                      lineHeight: "20px",
                    }}
                  >
                    Here are {repos.length} repos from your stars worth
                    revisiting.
                  </p>

                  {repos.map((repo) => (
                    <RepoCard key={repo.starId} repo={repo} />
                  ))}

                  {/* Footer */}
                  <EmailFooter
                    accountUrl={accountUrl}
                    unsubscribeUrl={unsubscribeUrl}
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
);
