import { useState, forwardRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = forwardRef((props, ref) => {
  const { user, updateUser } = useAuth();
  
  // Profile settings
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) { toast.error('Display name cannot be empty'); return; }
    setLoadingProfile(true);
    try {
      const res = await api.put('/auth/profile', { displayName });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill all password fields'); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    setLoadingPwd(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword, newPassword, confirmPassword
      });
      toast.success('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <div className="profile-section" id="profileSection" ref={ref}>
      <h2>🔑 My Account Settings</h2>
      <div className="profile-row">
        <div className="profile-field">
          <label>Login ID</label>
          <input type="text" value={user?.loginId || ''} disabled style={{ background: '#f3f4f6' }} />
        </div>
        <div className="profile-field">
          <label>Display Name</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>Role</label>
          <input type="text" value={user?.role || ''} disabled style={{ background: '#f3f4f6' }} />
        </div>
      </div>
      
      <div className="profile-row" style={{ marginTop: '12px' }}>
        <div className="profile-field">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
        </div>
        <div className="profile-field">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
        </div>
        <div className="profile-field">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
        </div>
      </div>
      
      <div className="profile-actions">
        <button className="tbl-btn primary" onClick={handleUpdateProfile} disabled={loadingProfile}>
          {loadingProfile ? 'Saving...' : 'Save Profile'}
        </button>
        <button className="tbl-btn" onClick={handleChangePassword} disabled={loadingPwd}>
          {loadingPwd ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
});

export default Profile;
