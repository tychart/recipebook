// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Logo from "../../components/Logo";

/** Pan overlay only after this delay so fast failed logins skip the motion-heavy UI */
const AUTH_OVERLAY_DELAY_MS = 280;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPanOverlay, setShowPanOverlay] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();
  const { showError } = useToast();

  const isSubmitDisabled = username.trim() === "" || password.trim() === "";

  useEffect(() => {
    if (!submitting) {
      setShowPanOverlay(false);
      return;
    }
    const id = window.setTimeout(() => setShowPanOverlay(true), AUTH_OVERLAY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [submitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);
    try {
      await login(username, password);
      setUsername("");
      setPassword("");
      navigate("/cookbooks");
    } catch (err) {
      console.error("Login failed", err);
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your username and password.";
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]">
      <section className="app-panel hidden lg:flex lg:flex-col lg:justify-between">
        <div>
          <Logo size="large" withTagline />
          <p className="mt-8 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
            Pick up where you left off, jump into shared cookbooks, and keep every saved recipe within easy reach.
          </p>
        </div>
        <div className="space-y-3">
          {["Theme-aware light and dark modes", "Comfortable touch targets for phones and tablets", "Kitchen-friendly browsing with installable app support"].map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-5">
        <div className="lg:hidden">
          <Logo size="medium" />
        </div>
        <AuthForm
        title="Welcome back"
        description="Sign in to browse cookbooks, search recipes, and manage your shared kitchen space."
        onSubmit={handleSubmit}
        isLoading={submitting}
        showLoadingOverlay={showPanOverlay}
        isSubmitDisabled={isSubmitDisabled}
        buttonText="Log In"
        loadingMessage="Logging in, please wait"
        footer={
          <p>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="app-link font-semibold">
              Register here
            </Link>
          </p>
        }
      >
        <FormRow
          label="Username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <FormRow
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </AuthForm>
        <div className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-secondary)]">
          New here? <Link to="/register" className="app-link font-semibold">Create an account</Link> to start building your recipe library.
        </div>
      </div>
    </div>
  );
};

export default Login;
