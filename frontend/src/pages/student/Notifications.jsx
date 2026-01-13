import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { 
  Bell, Heart, MessageCircle, Users, DollarSign, Video, 
  Check, Trash2, Loader2, Mail, Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unreadOnly', 'true');

      const response = await api.get(`/notifications?${params.toString()}`);
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingRead(true);
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_subscriber: <Users className="w-5 h-5" />,
      post_liked: <Heart className="w-5 h-5" />,
      post_commented: <MessageCircle className="w-5 h-5" />,
      tip_received: <DollarSign className="w-5 h-5" />,
      live_stream_started: <Video className="w-5 h-5" />,
      new_message: <Mail className="w-5 h-5" />,
      default: <Bell className="w-5 h-5" />,
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      new_subscriber: 'bg-blue-100 text-blue-600',
      post_liked: 'bg-red-100 text-red-600',
      post_commented: 'bg-green-100 text-green-600',
      tip_received: 'bg-yellow-100 text-yellow-600',
      live_stream_started: 'bg-purple-100 text-purple-600',
      new_message: 'bg-indigo-100 text-indigo-600',
      default: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-text-secondary">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingRead}
              className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-lg hover:bg-bg-hover disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {markingRead ? 'Marking...' : 'Mark all read'}
            </button>
          )}
          <Link
            to="/settings"
            className="p-2 bg-bg-tertiary rounded-lg hover:bg-bg-hover"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === tab.id
                ? 'bg-accent text-white'
                : 'bg-bg-tertiary hover:bg-bg-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-border rounded-lg">
          <Bell className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <h3 className="text-xl font-medium mb-2">No notifications</h3>
          <p className="text-text-secondary">
            {filter === 'unread' 
              ? 'You have no unread notifications'
              : "You don't have any notifications yet"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-bg-card border border-border rounded-lg p-4 flex items-start gap-4 ${
                !notification.isRead ? 'border-l-4 border-l-accent' : ''
              }`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {notification.link && (
                  <Link
                    to={notification.link}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    className="px-3 py-1 text-sm bg-bg-tertiary rounded-lg hover:bg-bg-hover"
                  >
                    View
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(notification._id)}
                  className="p-2 text-text-muted hover:text-error rounded-lg hover:bg-bg-hover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

