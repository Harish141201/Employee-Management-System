import "../style/header.css";
import { useAuth } from "../context/useAuth";
import { useNavigate, Link } from "react-router-dom";

function Header() {

    const { user, isAuthenticated, hasRole, logout } = useAuth();

    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (

        <header className="top-header">

            <div className="header-container">

                {/* Logo */}

                <div className="logo-section">

                    <Link to="/" className="logo-link">

                        <div className="logo-icon">
                            <i className="bi bi-buildings-fill"></i>
                        </div>

                        <div>

                            <h3 className="logo-title">
                                People<span>Hub</span>
                            </h3>

                            <small>
                                Employee Management System
                            </small>

                        </div>

                    </Link>

                </div>

                {/* Right Section */}

                {isAuthenticated && (

                    <div className="header-right">

                        {hasRole("ADMIN", "HR") && (

                            <Link
                                to="/dashboard"
                                className="dashboard-btn"
                            >
                                <i className="bi bi-grid-fill"></i>

                                Dashboard
                            </Link>

                        )}

                        <div className="user-info">

                            <div className="avatar">

                                {user.username.charAt(0).toUpperCase()}

                            </div>

                            <div>

                                <h6>{user.username}</h6>

                                <small>{user.role}</small>

                            </div>

                        </div>

                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                        >

                            <i className="bi bi-box-arrow-right"></i>

                            Logout

                        </button>

                    </div>

                )}

            </div>

        </header>

    );

}

export default Header;