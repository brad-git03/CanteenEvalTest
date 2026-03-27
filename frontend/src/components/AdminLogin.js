import React, { useState } from "react";

export default function AdminLogin({ navigate }) {
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") navigate("admin-dashboard");
    else alert("Invalid credentials. Try 'admin123'");
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
        
        {/* NEW UA LOGO */}
        <img 
          src="/ua-logo.png" /* Make sure this matches your file name in the public folder */
          alt="University of the Assumption Logo" 
          style={{ 
            width: '75px', 
            height: '75px', 
            borderRadius: '50%', 
            marginBottom: '20px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)'
          }} 
        />
        
        <h2 className="serif" style={{ fontSize: '1.8rem' }}>Admin <span style={{ color: 'var(--accent-gold)' }}>Login</span></h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '30px', lineHeight: '1.4' }}>
          University of the Assumption<br/>Canteen Evaluation System
        </p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <label>Username</label>
          <input type="text" value="admin" disabled style={{ color: '#999', backgroundColor: '#f9f9f9' }} />
          
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            required 
          />

          <button type="submit" className="btn-primary" style={{ marginTop: '30px', marginBottom: '15px', backgroundColor: 'var(--bg-dark-green)' }}>
            Login →
          </button>
        </form>

        <button className="btn-secondary" onClick={() => navigate('landing')} style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}