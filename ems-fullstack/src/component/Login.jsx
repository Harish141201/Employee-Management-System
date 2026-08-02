import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../style/employeeform.css";

function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const redirectTo = location.state?.from?.pathname || "/";

    async function handleSubmit(e) {

        e.preventDefault();

        setError("");

        setSubmitting(true);

        try {

            await login(username, password);

            navigate(redirectTo, { replace: true });

        } catch (err) {

            setError(
                err?.response?.data?.message ||
                "Invalid username or password."
            );

        } finally {

            setSubmitting(false);

        }

    }

    return (

        <div className="login-page">

            {/* LEFT PANEL */}

            <div className="login-left">

                <div className="brand">

                    <div className="logo-circle">

                        <i className="bi bi-buildings-fill"></i>

                    </div>

                    <h1 className="brand-title">
                        People<span>Hub</span>
                    </h1>

                 <h4 className="brand-subtitle">
    Modern Employee Management Platform
</h4>

<div className="brand-divider"></div>

<p className="brand-description">
    Streamline employee management with a secure,
    modern and intuitive platform designed for
    organizations of every size.
</p>

                    <div className="illustration-box">

                        <i className="bi bi-people-fill"></i>

                        <h3>Core Features</h3>

           <div className="feature-list">

    <div className="feature-item">
        ✔ Employee Records
    </div>

    <div className="feature-item">
        ✔ Department Management
    </div>

    <div className="feature-item">
        ✔ Secure Access
    </div>

</div>

                    </div>

                </div>

            </div>

            {/* RIGHT PANEL */}

            <div className="login-right">

                <div className="login-card">

                    <div className="text-center mb-4">

                        <h2>Welcome Back 👋</h2>

                        <p className="subtitle">
                           
                            <strong> Access your PeopleHub workspace </strong>
                        </p>

                    </div>

                    {
                        error &&
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    }

                    <form onSubmit={handleSubmit}>
                        <div className="input-group-custom">

                            <i className="bi bi-person-fill input-icon"></i>

                            <input
                                type="text"
                                className="form-input"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />

                        </div>

                        <div className="input-group-custom">

                            <i className="bi bi-lock-fill input-icon"></i>

                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i
                                    className={
                                        showPassword
                                            ? "bi bi-eye-slash-fill"
                                            : "bi bi-eye-fill"
                                    }
                                ></i>
                            </button>

                        </div>

                        <div className="login-options">

                            <label className="remember-me">

                                <input type="checkbox" />

                                <span>Remember Me</span>

                            </label>

                           

                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={submitting}
                        >

                            {
                                submitting
                                    ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                            ></span>

                                            Signing In...
                                        </>
                                    )
                                    : (
                                        <>
                                            <i className="bi bi-box-arrow-in-right me-2"></i>

                                            Access Dashboard
                                        </>
                                    )
                            }

                        </button>

                    </form>

                    <div className="login-footer">

                        <p>

                            © 2026 <strong>PeopleHub</strong>

                        </p>

                        <small>

                            Employee Management System

                        </small>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Login;