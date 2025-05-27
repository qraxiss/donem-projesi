import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // CHANGE !! fake password
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your email");
            return;
        }

        try {
            await axios.post("http://localhost:8000/register", { email });
            alert("Registration successful! Please login.");
            navigate("/login");
        } catch (err) {
            console.error("Registration error:", err);
            alert("Registration failed. Email might already exist.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
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
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Register;