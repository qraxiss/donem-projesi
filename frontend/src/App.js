import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom"; // CHANGE !!
import Home from "./components/Home"; // CHANGE !!
import Login from "./components/Login"; // CHANGE !!
import Register from "./components/Register"; // CHANGE !!
import Library from "./components/Library"; // CHANGE !!
import BookReviews from "./components/BookReviews"; // CHANGE !!
import "./App.css";

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || ""); // CHANGE !!

  const handleLogout = () => { // CHANGE !!
    setUserEmail("");
    localStorage.removeItem("userEmail");
  };

  return (
    <Router> {/* CHANGE !! */}
      <div className="container">
        <header className="header">
          <h1 className="logo">BookBuddy 🎯</h1>
          <nav className="nav"> {/* CHANGE !! */}
            <Link to="/">Home</Link>
            {userEmail ? (
              <>
                <Link to="/library">My Library</Link>
                <span>Welcome, {userEmail}</span>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </header>

        <Routes> {/* CHANGE !! */}
          <Route path="/" element={<Home userEmail={userEmail} />} />
          <Route
            path="/login"
            element={userEmail ? <Navigate to="/" /> : <Login setUserEmail={setUserEmail} />}
          />
          <Route
            path="/register"
            element={userEmail ? <Navigate to="/" /> : <Register />}
          />
          <Route
            path="/library"
            element={userEmail ? <Library userEmail={userEmail} /> : <Navigate to="/login" />}
          />
          <Route
            path="/book/reviews"
            element={<BookReviews userEmail={userEmail} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;