import { useState } from "react";
import "../style/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isSubmitDisabled = () => {
    return username.trim() === "" || password.trim() === "";
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: send register request to backend
    console.log("Username:", username);
    console.log("Password:", password);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 id="login-header">Welcome to RecipeBook! Please Login:</h2>
        <div className="form-inputs">
          <div className="form-row">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" disabled={isSubmitDisabled()}>
          Login
        </button>
        <p>
          Don't have an account? <a href="/register">Register Here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
