const COMPANY_NAME = "INFINITE CHAPTERS LTD";
const COMPANY_ADDRESS =
  "Electric Works Digital Campus, 3 Concourse Way, Sheffield, S1 2BJ, United Kingdom";

interface EmailFooterProps {
  accountUrl: string;
  unsubscribeUrl: string;
}

export const EmailFooter = ({
  accountUrl,
  unsubscribeUrl,
}: EmailFooterProps) => (
  <table
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    role="presentation"
    style={{
      marginTop: "32px",
      borderTop: "1px solid rgba(198,198,198,0.15)",
    }}
  >
    <tr>
      <td
        style={{
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          color: "#ababab",
          lineHeight: "18px",
        }}
      >
        You're receiving this because you opted in to the re:starred weekly
        digest.
      </td>
    </tr>
    <tr>
      <td
        style={{
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: "#ababab",
          lineHeight: "20px",
          paddingTop: "20px",
        }}
      >
        <a
          href={accountUrl}
          style={{
            color: "#5e5e5e",
            textDecoration: "underline",
          }}
        >
          Manage your digest
        </a>
        <span style={{ margin: "0 8px", color: "#ababab" }}>&middot;</span>
        <a
          href={unsubscribeUrl}
          style={{
            color: "#ababab",
            textDecoration: "underline",
          }}
        >
          Unsubscribe
        </a>
        <span style={{ margin: "0 8px", color: "#ababab" }}>&middot;</span>
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
          paddingTop: "20px",
        }}
      >
        {COMPANY_NAME}
        <br />
        {COMPANY_ADDRESS}
      </td>
    </tr>
  </table>
);
