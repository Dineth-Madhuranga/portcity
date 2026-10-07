import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Header({ onActivityToggle, onAdminOpen, onProfileClick, unsaved }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const initials = user?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="app-header">
      <h1>📊 Admin &amp; HR Work Progress</h1>
      <div className="header-right">
        {unsaved && <span className="unsaved-badge">⚠ Unsaved</span>}
        <button className="header-btn" onClick={onActivityToggle}>📋 Activity</button>
        {isAdmin() && (
          <button className="header-btn" onClick={onAdminOpen}>👤 User Mgmt</button>
        )}
        <div className="user-badge" onClick={onProfileClick} title="View Profile">
          <div className="avatar" style={{ background: user?.color || '#2563eb' }}>
            {initials}
          </div>
          <span>{user?.displayName || 'User'}</span>
          <span className="role-tag">{user?.role}</span>
        </div>
        <button className="header-btn danger" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
