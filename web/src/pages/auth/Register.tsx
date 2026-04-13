// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../style/Register.css";
import Logo from "../../components/Logo";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showError } = useToast();

  const passwordsMatch = password === confirmPassword;
  const showPasswordError = confirmPassword.length > 0 && !passwordsMatch;

  const isSubmitDisabled =
    username.trim() === "" ||
    email.trim() === "" ||
    password.trim() === "" ||
    confirmPassword.trim() === "" ||
    !passwordsMatch;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    console.log("Submitting registration...");

    event.preventDefault();

    if (!passwordsMatch) return;

    try {
      await register(username, email, password);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration failed", err);
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      showError(message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Logo size="medium" />

      <AuthForm
        title="Create your account"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSubmitDisabled={isSubmitDisabled}
        buttonText="Register"
        loadingMessage="Registering, please wait"
        containerClass="register-container"
        formClass="register-form"
        footer={
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Login Here
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
          label="Email:"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormRow
          label="Password:"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormRow
          label="Confirm Password:"
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {showPasswordError && (
          <div className="text-red-500 text-sm mt-2" role="alert">
            Passwords do not match
          </div>
        )}

        {confirmPassword.length > 0 && passwordsMatch && (
          <div className="text-green-600 text-sm mt-2">Passwords match ✓</div>
        )}
      </AuthForm>
    </div>
  );
};

export default Register;
