import { useState } from "react";
import "../style/Register.css";

const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const isSubmitDisabled = () => {
    return (
      username.trim() === "" || email.trim() === "" || password.trim() === ""
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: send register request to backend
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password:", password);
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
        </div>
        <button type="submit" disabled={isSubmitDisabled()}>
          Register
        </button>
        <p>
          Already have an account? <a href="/login">Login Here</a>
        </p>
      </form>
    </div>
  );
};

export default Register;
