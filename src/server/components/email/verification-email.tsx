interface VerificationEmailProps {
  pin: string;
  expiryHours: number;
}

export const VerificationEmail = ({
  pin,
  expiryHours,
}: VerificationEmailProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="color-scheme" content="light" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
        rel="stylesheet"
      />
      <title>re:starred — verification code</title>
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
          <td style={{ padding: "32px 8px" }} align="center">
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
                <td style={{ padding: "32px 16px 24px 16px" }}>
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
                        <a
                          href="https://restarred.dev"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            fontSize: "20px",
                            color: "#000000",
                            letterSpacing: "-0.02em",
                            textDecoration: "none",
                          }}
                        >
                          re:starred
                        </a>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          color: "#ababab",
                        }}
                      >
                        Email verification
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
                    Enter this code on your account page to verify your email
                    address.
                  </p>

                  {/* PIN code */}
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    role="presentation"
                    style={{ marginBottom: "24px" }}
                  >
                    <tr>
                      <td
                        align="center"
                        style={{
                          backgroundColor: "#f3f3f4",
                          borderRadius: "8px",
                          padding: "24px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "36px",
                            fontWeight: 500,
                            letterSpacing: "0.2em",
                            color: "#1a1c1c",
                          }}
                        >
                          {pin}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      color: "#ababab",
                      margin: "0 0 32px",
                      lineHeight: "20px",
                    }}
                  >
                    This code expires in {expiryHours} hours. If you didn't
                    request this, you can safely ignore this email.
                  </p>

                  {/* Footer */}
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    role="presentation"
                    style={{
                      borderTop: "1px solid rgba(198,198,198,0.15)",
                      paddingTop: "24px",
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          color: "#ababab",
                          lineHeight: "20px",
                        }}
                      >
                        <a
                          href="https://restarred.dev/account"
                          style={{
                            color: "#5e5e5e",
                            textDecoration: "underline",
                          }}
                        >
                          Manage your account
                        </a>
                        <span style={{ margin: "0 8px", color: "#ababab" }}>
                          &middot;
                        </span>
                        <a
                          href="https://restarred.dev/privacy"
                          style={{
                            color: "#ababab",
                            textDecoration: "underline",
                          }}
                        >
                          Privacy Policy
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          textAlign: "center",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#ababab",
                          lineHeight: "18px",
                          paddingTop: "32px",
                        }}
                      >
                        INFINITE CHAPTERS LTD
                        <br />
                        Electric Works Digital Campus, 3 Concourse Way,
                        Sheffield, S1 2BJ, United Kingdom
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
);
