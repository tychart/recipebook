// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormRow from "../../components/FormRow";
import AuthForm from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import "../../style/Login.css";

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
    <AuthForm
      title="Welcome to RecipeBook! Please Login:"
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
          <Link to="/register">Register Here</Link>
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
  );
};

export default Login;