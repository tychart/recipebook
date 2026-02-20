import { useState } from "react";
import { Link } from "react-router-dom";
import FormRow from "../components/FormRow";
import AuthForm from "../components/AuthForm";
import useAuthSubmit from "../hooks/useAuthSubmit";
import "../style/Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { isLoading, handleAuth } = useAuthSubmit();

  const passwordsMatch = password === confirmPassword;
  const showPasswordError =
    confirmPassword.length > 0 && !passwordsMatch;

  const isSubmitDisabled =
    username.trim() === "" ||
    email.trim() === "" ||
    password.trim() === "" ||
    confirmPassword.trim() === "" ||
    !passwordsMatch;

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!passwordsMatch) return;

    await handleAuth(async () => {
      // TODO: Replace with real backend call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("Username:", username);
      console.log("Email:", email);

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <AuthForm
      title="Welcome to RecipeBook! Please Create an Account:"
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
          <Link to="/login">Login Here</Link>
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
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
      />

      {showPasswordError && (
        <div
          className="error-message"
          role="alert"
          aria-live="polite"
        >
          Passwords do not match
        </div>
      )}

      {confirmPassword.length > 0 && passwordsMatch && (
        <span className="success-text">
          Passwords match ✓
        </span>
      )}
    </AuthForm>
  );
};

export default Register;
