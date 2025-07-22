import React, { useState } from "react";
import "./SignUpPage.css";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [form, setForm] = useState({
    username: "",
    securityAnswer: "",
    newPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fetchedQuestion, setFetchedQuestion] = useState("");
  const [questionFetched, setQuestionFetched] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFetchQuestion = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/auth/forgot-password", {
        username: form.username
      });
      setFetchedQuestion(response.data.security_question);
      setQuestionFetched(true);
    } catch (error) {
      setErrorMsg("User not found or error fetching question.");
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/auth/reset-password", {
        username: form.username,
        security_answer: form.securityAnswer,
        new_password: form.newPassword
      });
      setSuccessMsg("Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1800);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg("Failed to reset password. Please check your info and try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="magazine-signup-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="desktop-window">
          <div className="desktop-titlebar">
            <div className="window-controls">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
            </div>
            Forgot Password
          </div>
          <div className="desktop-window-content">
            <form className="magazine-signup-form" onSubmit={handleReset} style={{ minWidth: 320 }}>
              <label className="magazine-label">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Your Username"
                value={form.username}
                onChange={handleChange}
                required
                disabled={questionFetched}
              />
              {!questionFetched && (
                <button
                  type="button"
                  className="magazine-signup-btn"
                  onClick={handleFetchQuestion}
                  disabled={loading || !form.username}
                  style={{ marginBottom: 16 }}
                >
                  {loading ? "Fetching..." : "Get Security Question"}
                </button>
              )}
              {questionFetched && (
                <>
                  <label className="magazine-label">Security Question</label>
                  <input
                    type="text"
                    value={fetchedQuestion}
                    disabled
                    style={{ background: "#f3f3f3" }}
                  />
                  <label className="magazine-label">Security Answer</label>
                  <input
                    type="text"
                    name="securityAnswer"
                    placeholder="Your Answer"
                    value={form.securityAnswer}
                    onChange={handleChange}
                    required
                  />
                  <label className="magazine-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <button type="submit" className="magazine-signup-btn" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
              {errorMsg && <div style={{ color: '#d72660', fontWeight: 600, margin: '8px 0', textAlign: 'center' }}>{errorMsg}</div>}
              {successMsg && <div style={{ color: '#22c55e', fontWeight: 600, margin: '8px 0', textAlign: 'center' }}>{successMsg}</div>}
              <button
                type="button"
                className="magazine-signup-btn"
                style={{
                  marginTop: 10,
                  background: '#ede9fe',
                  color: '#7c3aed',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '1.08rem',
                  width: '100%',
                  boxShadow: '0 2px 8px #e3f6fd44',
                  cursor: 'pointer',
                  transition: 'background 0.18s',
                }}
                onClick={() => window.location.href = '/signin'}
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 