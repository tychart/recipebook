import "../style/Login.css";

const Login = () => {
  return (
    <div>
      <h2 id="login-header">Welcome to RecipeBook! Please Login:</h2>
      <form>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" />
        </div>
        <button type="submit">Login</button>
        <p>
          Don't have an account? Register here: <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
