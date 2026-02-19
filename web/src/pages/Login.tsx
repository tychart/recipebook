import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isSubmitDisabled = () => {
    return username.trim() === "" || password.trim() === "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // TODO: send register request to backend. Remove timeout once implemented
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    setUsername("");
    setPassword("");
    console.log("Username:", username);
    console.log("Password:", password);
    // on success, route user to home page
    navigate("/");
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
          {isLoading ? "Loading..." : "Login"}
        </button>
        <p>
          Don't have an account? <a href="/register">Register Here</a>
        </p>
        <div
          className="loading-overlay"
          style={{ display: isLoading ? "flex" : "none" }}
        >
          <div className="spinner"></div>
        </div>
      </form>
    </div>
  );
};

export default Login;
