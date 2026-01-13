import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  User, Mail, Lock, Bell, Image, Shield, CreditCard, 
  Loader2, Save, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const AccountSettings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: '',
    banner: '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewSubscriber: true,
    emailNewPost: false,
    emailNewMessage: true,
    pushNewSubscriber: true,
    pushNewMessage: true,
    pushLiveStarted: true,
  });

  // Avatar/Banner files
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        banner: user.banner || '',
      });
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, banner: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('bio', profileData.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(response.data.data.user);
      toast.success('Profile updated successfully');
      setAvatarFile(null);
      setBannerFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await api.put('/users/notifications', notifications);
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-bg-hover'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>

              {/* Banner */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Banner</label>
                <div 
                  className="h-32 rounded-lg bg-bg-secondary bg-cover bg-center relative overflow-hidden cursor-pointer"
                  style={{ backgroundImage: `url(${profileData.banner || '/default-banner.png'})` }}
                  onClick={() => document.getElementById('bannerInput').click()}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Image className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  id="bannerInput"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </div>

              {/* Avatar */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <img
                    src={profileData.avatar || '/default-avatar.png'}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <label 
                    className="px-4 py-2 border border-border rounded-lg hover:bg-bg-hover cursor-pointer"
                  >
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Username */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={4}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Security Settings</h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPasswords ? 'Hide' : 'Show'} passwords
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNewSubscriber', label: 'New subscriber' },
                      { key: 'emailNewPost', label: 'New post from subscribed creators' },
                      { key: 'emailNewMessage', label: 'New message' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer">
                        <span>{item.label}</span>
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-5 h-5 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {user?.role === 'creator' && (
                  <div>
                    <h3 className="text-sm font-medium mb-4">Push Notifications (for Creators)</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'pushNewSubscriber', label: 'New subscriber' },
                        { key: 'pushNewMessage', label: 'New message' },
                        { key: 'pushLiveStarted', label: 'Live stream started' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between cursor-pointer">
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

