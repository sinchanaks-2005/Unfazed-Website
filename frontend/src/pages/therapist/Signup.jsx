import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Auth.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post(
        "/therapists/signup",
        {
          name,
          email,
          password,
        }
      );

      alert(response.data.message);

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Signup failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <h1>Unfazed</h1>
          <p>Create your Therapist Account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
          >
            Create Account
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link to="/therapist/login">
            Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Signup;