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
      </td>
    </tr>
  </table>
);
