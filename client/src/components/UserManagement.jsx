import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UserManagement({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New User Form State
  const [newUserId, setNewUserId] = useState('');
  const [newUserDisplay, setNewUserDisplay] = useState('');
  const [newUserPwd, setNewUserPwd] = useState('');
  const [newUserRole, setNewUserRole] = useState('User');

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (loginId) => {
    try {
      const res = await api.put(`/users/${loginId}/toggle`);
      setUsers(users.map(u => u.loginId === loginId ? res.data : u));
      toast.success(`User ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle user');
    }
  };

  const handleDelete = async (loginId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${loginId}`);
      setUsers(users.filter(u => u.loginId !== loginId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPwd = async (loginId) => {
    const newPwd = prompt(`Enter new password for ${loginId}:`);
    if (!newPwd) return;
    if (newPwd.length < 4) { toast.error('Password must be at least 4 characters'); return; }
    
    try {
      await api.put(`/users/${loginId}/reset-password`, {
        newPassword: newPwd,
        confirmPassword: newPwd
      });
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleAddUser = async () => {
    if (!newUserId || !newUserDisplay || !newUserPwd) {
      toast.error('Fill all required fields'); return;
    }
    try {
      const res = await api.post('/users', {
        loginId: newUserId,
        displayName: newUserDisplay,
        password: newUserPwd,
        role: newUserRole
      });
      setUsers([...users, res.data]);
      setShowAdd(false);
      setNewUserId(''); setNewUserDisplay(''); setNewUserPwd(''); setNewUserRole('User');
      toast.success('User created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  if (!open) return null;

  return (
    <div className={`modal-overlay ${open ? 'show' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) onClose(); }}>
      <div className="modal-box" style={{ width: '680px' }}>
        <h2>👤 User Management (Admin Only)</h2>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="tbl-btn primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '− Cancel Add' : '➕ Add New User'}
          </button>
        </div>

        {showAdd && (
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '.9rem', marginBottom: '10px' }}>Create New User</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="field">
                <label>Login ID *</label>
                <input type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="e.g. john" />
              </div>
              <div className="field">
                <label>Display Name *</label>
                <input type="text" value={newUserDisplay} onChange={e => setNewUserDisplay(e.target.value)} placeholder="e.g. John Smith" />
              </div>
              <div className="field">
                <label>Password *</label>
                <input type="password" value={newUserPwd} onChange={e => setNewUserPwd(e.target.value)} placeholder="Set password" />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="tbl-btn primary" onClick={handleAddUser}>Create User</button>
              <button className="tbl-btn" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading users...</div>
        ) : (
          <div className="user-mgmt-grid">
            {users.map(u => (
              <div key={u.loginId} className="user-mgmt-card">
                <div className="umc-header">
                  <span className="umc-name" style={{ color: u.color }}>{u.displayName}</span>
                  <span className={`umc-role ${u.role.toLowerCase()}`}>{u.role}</span>
                  {!u.enabled && <span className="disabled-badge">DISABLED</span>}
                </div>
                <div className="umc-info">
                  Login: <strong>{u.loginId}</strong> &middot; Created: {new Date(u.createdAt).toLocaleDateString()}
                </div>
                <div className="umc-actions">
                  <button onClick={() => handleToggle(u.loginId)}>
                    {u.enabled ? '🔴 Disable' : '🟢 Enable'}
                  </button>
                  <button onClick={() => handleResetPwd(u.loginId)}>🔑 Reset Pwd</button>
                  <button className="btn-del" onClick={() => handleDelete(u.loginId)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
