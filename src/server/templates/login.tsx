import { Layout } from "../components/layouts";

export interface LoginProps {
  error?: string;
}

const errorMessages: Record<string, string> = {
  github_denied: "GitHub authorization was denied.",
  missing_params: "Invalid callback parameters.",
  state_mismatch: "Security check failed. Please try again.",
  auth_failed: "Authentication failed. Please try again.",
};

export const Login = ({ error }: LoginProps) => (
  <Layout title="Sign in — restarred" name="login">
    <main className="login-page">
      <div className="login-container">
        <h1>Sign in</h1>
        {error && (
          <div className="login-error" role="alert">
            {errorMessages[error] || "An error occurred. Please try again."}
          </div>
        )}
        <a href="/auth/github" className="btn-github">
          Sign in with GitHub
        </a>
      </div>
    </main>
  </Layout>
);
