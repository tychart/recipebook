// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../style/Login.css";
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
      navigate("/dashboard");
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
    <div className="flex flex-col items-center justify-center gap-6">
      <Logo size="medium" />

      <AuthForm
        title="Welcome back! Please log in:"
        onSubmit={handleSubmit}
        isLoading={submitting}
        showLoadingOverlay={showPanOverlay}
        isSubmitDisabled={isSubmitDisabled}
        buttonText="Login"
        loadingMessage="Logging in, please wait"
        containerClass="login-container"
        formClass="login-form"
        footer={
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="register-link">
              Register Here
            </Link>
          </p>
        }
      >
        <FormRow
          label="Username:"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <FormRow
          label="Password:"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </AuthForm>
    </div>
  );
};

export default Login;
