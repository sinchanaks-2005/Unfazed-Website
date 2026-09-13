import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/therapists/login",
        {
          email,
          password,
        }
      );

      alert(response.data.message);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "therapist",
        JSON.stringify(response.data.therapist)
      );

      navigate("/therapist/dashboard");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <h1>Unfazed</h1>
          <p>Therapist Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{" "}
          <Link to="/therapist/signup">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;