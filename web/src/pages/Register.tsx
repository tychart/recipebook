import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Register.css";

const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const passwordsMatch = password === confirmPassword;
  const showPasswordError = confirmPassword.length > 0 && !passwordsMatch;
  const navigate = useNavigate();

  const isSubmitDisabled = () => {
    return (
      username.trim() === "" ||
      email.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === "" ||
      !passwordsMatch
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    setIsLoading(true);
    // TODO: send register request to backend
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password:", password);
    // on success, route user to home page
    navigate("/");
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2 id="register-header">
          Welcome to RecipeBook! Please Create an Account:
        </h2>
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
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <div className="form-row">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {showPasswordError && (
            <div className="error-message">Passwords do not match</div>
          )}
          {confirmPassword.length > 0 && passwordsMatch && (
            <span className="success-text">Passwords match ✓</span>
          )}
        </div>
        <button type="submit" disabled={isSubmitDisabled()}>
          {isLoading ? "Loading..." : "Register"}
        </button>
        <p>
          Already have an account? <a href="/login">Login Here</a>
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

export default Register;
