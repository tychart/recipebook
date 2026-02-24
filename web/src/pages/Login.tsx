import { useState } from "react";
import { Link } from "react-router-dom";
import FormRow from "../components/FormRow";
import AuthForm from "../components/AuthForm";
import useAuthSubmit from "../hooks/useAuthSubmit";
import "../style/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { isLoading, handleAuth } = useAuthSubmit();

  const isSubmitDisabled =
    username.trim() === "" || password.trim() === "";

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await handleAuth(async () => {
      // TODO: Replace with real backend call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("Username:", username);
      console.log("Password:", password);

      setUsername("");
      setPassword("");
    });
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
