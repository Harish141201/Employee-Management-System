import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../style/employeeform.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                "Invalid username or password"
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

                    <i className="bi bi-buildings-fill brand-icon"></i>

                    <h1 className="brand-title">
                        People<span>Hub</span>
                    </h1>

                    <h4 className="brand-subtitle">
                        Modern Employee Management Platform
                    </h4>

                    <p className="brand-tagline">
                        Simplify workforce management with a secure,
                        intuitive platform designed for modern
                        organizations.
                    </p>



                </div>

            </div>

            {/* RIGHT PANEL */}

            <div className="login-right">

                <div className="login-card">

                    <div className="text-center mb-4">

                        <i
                            className="bi bi-person-circle"
                            style={{
                                fontSize: "65px",
                                color: "#2563eb"
                            }}
                        ></i>

                        <h2 className="mt-3">
                            Welcome Back
                        </h2>

                        <p className="subtitle">
                            Sign in to continue to
                            <strong> PeopleHub</strong>
                        </p>

                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="input-box">

                            <i className="bi bi-person-fill"></i>

                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                            />

                        </div>

                        <div className="input-box">

                            <i className="bi bi-lock-fill"></i>

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
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

                        <button
                            className="login-btn"
                            type="submit"
                            disabled={submitting}
                        >

                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    Access Dashboard
                                </>
                            )}

                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default Login;