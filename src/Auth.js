import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "10px 14px", border: "1px solid #3b444c",
    borderRadius: 4, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#c7d1db", background: "#22272b", marginBottom: 12,
  };

  const btn = {
    width: "100%", padding: "10px", borderRadius: 4, border: "none",
    background: "#0065ff", color: "#fff", cursor: loading ? "not-allowed" : "pointer",
    fontSize: 14, fontWeight: 700, fontFamily: "inherit",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1d2125", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#161a1d", borderRadius: 8, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "1px solid #2c333a" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "#0065ff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 12 }}>D</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#c7d1db" }}>Dashboard Tracker</h1>
          <p style={{ margin: 0, color: "#8c9bab", fontSize: 13 }}>{isLogin ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inp}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inp}
            required
            disabled={loading}
            minLength={6}
          />

          {error && (
            <div style={{ padding: "8px 12px", background: "#de350b22", border: "1px solid #de350b", borderRadius: 4, color: "#de350b", fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: "none", border: "none", color: "#0065ff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
