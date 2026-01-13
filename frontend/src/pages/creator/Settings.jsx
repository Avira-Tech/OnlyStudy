
import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  User, Mail, Lock, Bell, Image, Shield, CreditCard, 
  Loader2, Save, Eye, EyeOff, DollarSign, Globe, MessageSquare,
  CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreatorSettings = () => {
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
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
    },
  });

  // Pricing form
  const [pricingData, setPricingData] = useState({
    basicPrice: 4.99,
    premiumPrice: 9.99,
    vipPrice: 19.99,
    allowTips: true,
    allowPPV: true,
  });

  // Stripe account
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

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
    emailNewTip: true,
    pushNewSubscriber: true,
    pushNewMessage: true,
    pushNewTip: true,
    pushLiveStarted: true,
  });

  // Files
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
        socialLinks: {
          twitter: user.socialLinks?.twitter || '',
          instagram: user.socialLinks?.instagram || '',
          youtube: user.socialLinks?.youtube || '',
        },
      });
      setPricingData({
        basicPrice: user.pricing?.basic || 4.99,
        premiumPrice: user.pricing?.premium || 9.99,
        vipPrice: user.pricing?.vip || 19.99,
        allowTips: user.allowTips !== false,
        allowPPV: user.allowPPV !== false,
      });
      setStripeConnected(!!user.stripeAccountId);
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
      formData.append('socialLinks', JSON.stringify(profileData.socialLinks));
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

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await api.put('/users/pricing', pricingData);
      updateUser({ ...user, pricing: pricingData });
      toast.success('Pricing updated successfully');
    } catch (error) {
      toast.error('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setStripeLoading(true);
    try {
      const response = await api.post('/payments/connect');
      window.location.href = response.data.data.url;
    } catch (error) {
      toast.error('Failed to connect Stripe');
      setStripeLoading(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!window.confirm('Are you sure you want to disconnect Stripe? You won\'t be able to receive payments.')) return;
    
    try {
      await api.post('/payments/disconnect');
      updateUser({ ...user, stripeAccountId: null });
      setStripeConnected(false);
      toast.success('Stripe disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Stripe');
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
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Creator Settings</h1>

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
              <h2 className="text-lg font-semibold mb-6">Creator Profile</h2>

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
                <p className="text-xs text-text-muted mt-1">your-onlystudy.com/{profileData.username}</p>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell your subscribers about yourself..."
                  rows={4}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Social Links */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Social Links</label>
                <div className="space-y-3">
                  {['twitter', 'instagram', 'youtube'].map((platform) => (
                    <div key={platform} className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary capitalize" />
                      <input
                        type="text"
                        value={profileData.socialLinks[platform]}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, [platform]: e.target.value }
                        }))}
                        placeholder={`${platform} username`}
                        className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent capitalize"
                      />
                    </div>
                  ))}
                </div>
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

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Subscription Tiers</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'basicPrice', label: 'Basic Tier', color: 'bg-gray-100 text-gray-700' },
                    { key: 'premiumPrice', label: 'Premium Tier', color: 'bg-yellow-100 text-yellow-700' },
                    { key: 'vipPrice', label: 'VIP Tier', color: 'bg-purple-100 text-purple-700' },
                  ].map((tier) => (
                    <div key={tier.key} className="bg-bg-secondary rounded-lg p-4">
                      <label className="block text-sm font-medium mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${tier.color}`}>{tier.label}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                        <input
                          type="number"
                          value={pricingData[tier.key]}
                          onChange={(e) => setPricingData(prev => ({ ...prev, [tier.key]: parseFloat(e.target.value) }))}
                          min="0.99"
                          max="99.99"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer p-4 bg-bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Allow Tips</p>
                        <p className="text-sm text-text-muted">Let subscribers send you one-time tips</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPricingData(prev => ({ ...prev, allowTips: !prev.allowTips }))}
                      className={pricingData.allowTips ? 'text-success' : 'text-text-muted'}
                    >
                      {pricingData.allowTips ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-4 bg-bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">Allow Pay-Per-View</p>
                        <p className="text-sm text-text-muted">Sell individual posts or exclusive content</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPricingData(prev => ({ ...prev, allowPPV: !prev.allowPPV }))}
                      className={pricingData.allowPPV ? 'text-success' : 'text-text-muted'}
                    >
                      {pricingData.allowPPV ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                    </button>
                  </label>
                </div>

                <button
                  onClick={handleSavePricing}
                  disabled={saving}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Pricing
                </button>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6">Payment Settings</h2>

              <div className="space-y-6">
                <div className={`p-4 rounded-lg ${stripeConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center gap-3">
                    {stripeConnected ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {stripeConnected ? 'Stripe Connected' : 'Stripe Not Connected'}
                      </p>
                      <p className="text-sm text-text-muted">
                        {stripeConnected 
                          ? 'Your account is ready to receive payments' 
                          : 'Connect Stripe to start receiving payments from subscribers'}
                      </p>
                    </div>
                  </div>
                </div>

                {stripeConnected ? (
                  <div className="space-y-4">
                    <div className="bg-bg-secondary rounded-lg p-4">
                      <h3 className="font-medium mb-2">Account Status</h3>
                      <p className="text-sm text-text-muted">Your Stripe account is active and ready to receive payments.</p>
                    </div>
                    <button
                      onClick={handleDisconnectStripe}
                      className="px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors"
                    >
                      Disconnect Stripe
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectStripe}
                    disabled={stripeLoading}
                    className="px-6 py-2 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#5851db] disabled:opacity-50 flex items-center gap-2"
                  >
                    {stripeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Connect Stripe Account
                  </button>
                )}

                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="font-medium mb-2">Platform Fee</h3>
                  <p className="text-sm text-text-muted">
                    OnlyStudy charges a 20% platform fee on all transactions. You keep 80% of earnings.
                  </p>
                </div>

                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="font-medium mb-2">Payout Schedule</h3>
                  <p className="text-sm text-text-muted">
                    Payouts are processed weekly (every Monday) for the previous week's earnings.
                    Minimum payout amount is $100.
                  </p>
                </div>
              </div>
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
                      { key: 'emailNewTip', label: 'New tip received' },
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

                <div>
                  <h3 className="text-sm font-medium mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushNewSubscriber', label: 'New subscriber' },
                      { key: 'pushNewTip', label: 'New tip received' },
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

export default CreatorSettings;

