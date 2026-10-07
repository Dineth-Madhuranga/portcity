import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId || !password) { setError('Please enter Login ID and Password.'); return; }
    setLoading(true);
    try {
      await login(loginId.trim(), password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">📊</div>
        <h1>Dashboard Login</h1>
        <p className="login-subtitle">Admin &amp; HR Work Progress Dashboard</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="loginId">Login ID</label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="Enter your Login ID"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your Password"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '🔄 Signing in...' : '🔐 Sign In'}
          </button>
        </form>
        <div className="login-hint">
          <strong>Default credentials:</strong><br />
          Admin: <code>admin</code> / <code>admin123</code><br />
          HR Manager: <code>hrmanager</code> / <code>hr123</code><br />
          Regular users: contact Admin to create your account
        </div>
      </div>
    </div>
  );
}
