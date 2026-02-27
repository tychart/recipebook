// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import "../../style/Login.css";
import Logo from "../../components/Logo";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { login, isLoading } = useAuth();

  const isSubmitDisabled = username.trim() === "" || password.trim() === "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login(username, password);
      setUsername("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed. Please check your username and password.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <Logo size="medium" />

      <AuthForm
        title="Welcome back! Please log in:"
        onSubmit={handleSubmit}
        isLoading={isLoading}
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
