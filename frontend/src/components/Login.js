import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setUserEmail }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // CHANGE !! fake password
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your email");
            return;
        }

        // CHANGE !! No real authentication, just store email
        localStorage.setItem("userEmail", email);
        setUserEmail(email);
        navigate("/");
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter any password"
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;