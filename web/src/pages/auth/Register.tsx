// src/pages/Register.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Logo from "../../components/Logo";
import { StatusBanner } from "../../components/ui/StatusBanner";

const AUTH_OVERLAY_DELAY_MS = 280;

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPanOverlay, setShowPanOverlay] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();
  const { showError } = useToast();

  const passwordsMatch = password === confirmPassword;
  const showPasswordError = confirmPassword.length > 0 && !passwordsMatch;

  const isSubmitDisabled =
    username.trim() === "" ||
    email.trim() === "" ||
    password.trim() === "" ||
    confirmPassword.trim() === "" ||
    !passwordsMatch;

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

    if (!passwordsMatch) return;

    setSubmitting(true);
    try {
      await register(username, email, password);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/cookbooks");
    } catch (err) {
      console.error("Registration failed", err);
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]">
      <section className="app-panel hidden lg:block">
        <Logo size="large" withTagline />
        <p className="mt-8 text-base leading-7 text-[var(--text-secondary)]">
          Create a shared home for favorite dinners, handwritten family notes, and the cookbooks you build together.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            "Shared cookbook roles",
            "Recipe search across your library",
            "Progressive web app install support",
            "Designed for phone, tablet, and desktop",
          ].map((item) => (
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
        title="Create your account"
        description="Set up your RecipeBook account and start organizing cookbooks with a polished, installable recipe experience."
        onSubmit={handleSubmit}
        isLoading={submitting}
        showLoadingOverlay={showPanOverlay}
        isSubmitDisabled={isSubmitDisabled}
        buttonText="Register"
        loadingMessage="Registering, please wait"
        footer={
          <p>
            Already have an account?{" "}
            <Link to="/login" className="app-link font-semibold">
              Log in here
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
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <FormRow
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <FormRow
          label="Confirm Password"
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        {showPasswordError && (
          <StatusBanner tone="danger" role="alert">
            Passwords do not match
          </StatusBanner>
        )}

        {confirmPassword.length > 0 && passwordsMatch && (
          <StatusBanner tone="success">
            Passwords match
          </StatusBanner>
        )}
      </AuthForm>
      </div>
    </div>
  );
};

export default Register;
