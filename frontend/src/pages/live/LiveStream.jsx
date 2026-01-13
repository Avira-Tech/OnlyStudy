import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import useWebRTC from '../../hooks/useWebRTC';
import VideoPlayer from '../../components/live/VideoPlayer';
import {
  Heart, MessageCircle, Share2, Gift, Send, Users, 
  MoreHorizontal, ArrowLeft, User, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const LiveStream = () => {
  const { streamId } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [stream, setStream] = useState(null);
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const chatContainerRef = useRef(null);

  const {
    isConnected,
    stream: localStream,
    remoteStream,
    viewerCount,
    chatMessages,
    reactions,
    error,
    startLocalStream,
    sendChatMessage,
    sendReaction,
    toggleAudio,
    toggleVideo,
    leaveStream,
  } = useWebRTC(streamId, user?._id, false);

  // Fetch stream details
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await api.get(`/streams/${streamId}`);
        const streamData = response.data.data.stream;
        setStream(streamData);
        setHasAccess(streamData.hasAccess);
        setStreamer(streamData.streamer);
      } catch (err) {
        console.error('Failed to fetch stream:', err);
        toast.error('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [streamId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleJoinStream = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to join the stream');
      return;
    }

    try {
      await startLocalStream(false, false); // Start without video/audio for viewers
    } catch (err) {
      console.error('Failed to join stream:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleReaction = (emoji) => {
    sendReaction(emoji);
    setShowEmojiPicker(false);
  };

  const handleTip = async () => {
    if (!tipAmount || tipAmount < 1) {
      toast.error('Minimum tip amount is $1');
      return;
    }

    try {
      // In production, this would open Stripe checkout
      toast.success(`Thank you for your $${tipAmount} tip! 💖`);
      setShowTipModal(false);
      setTipAmount(5);
    } catch (err) {
      toast.error('Failed to send tip');
    }
  };

  const handleLeave = () => {
    leaveStream();
    window.history.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Stream not found</h2>
        <Link to="/explore" className="text-accent hover:underline">
          Explore other streams
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/explore" className="p-2 hover:bg-bg-hover rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{stream.title}</h1>
              <Link 
                to={`/creator/${streamer?.username}`}
                className="text-sm text-text-secondary hover:text-accent"
              >
                {streamer?.username}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users className="w-4 h-4" />
              {viewerCount}
            </div>
            <button 
              onClick={handleLeave}
              className="px-4 py-2 text-sm bg-error text-white rounded-full hover:bg-error/80"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              {hasAccess ? (
                <VideoPlayer
                  stream={remoteStream}
                  isLive={true}
                  viewerCount={viewerCount}
                  muted={false}
                />
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center bg-gray-900">
                  <Lock className="w-16 h-16 text-gray-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Locked Content
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {stream.accessType === 'subscribers' 
                      ? 'Subscribe to watch this live stream'
                      : 'Pay to watch this live stream'
                    }
                  </p>
                  {stream.accessType === 'subscribers' ? (
                    <Link
                      to={`/creator/${streamer?.username}`}
                      className="px-6 py-2 bg-accent text-white rounded-full hover:bg-accent/80"
                    >
                      Subscribe
                    </Link>
                  ) : (
                    <button
                      onClick={() => {/* Handle pay-per-view */}}
                      className="px-6 py-2 bg-accent text-white rounded-full hover:bg-accent/80"
                    >
                      Pay ${stream.price}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stream Info */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={streamer?.avatar || '/default-avatar.png'}
                    alt={streamer?.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{streamer?.username}</h3>
                    <p className="text-sm text-text-secondary">{streamer?.bio}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-bg-hover rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <p className="text-text-secondary mb-4">{stream.description}</p>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleReaction('❤️')}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-full hover:bg-bg-hover"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTipModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-full hover:bg-bg-hover"
                >
                  <Gift className="w-4 h-4" />
                  Tip
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-full hover:bg-bg-hover">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-bg-card border border-border rounded-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Live Chat</h3>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say something!</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <img
                      src={msg.avatar || '/default-avatar.png'}
                      alt={msg.username}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div>
                      <span className="font-medium text-sm">{msg.username}</span>
                      <p className="text-sm text-text-secondary">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reactions */}
            {reactions.length > 0 && (
              <div className="absolute bottom-20 left-4 flex gap-1">
                {reactions.map((reaction, index) => (
                  <span key={index} className="text-2xl animate-bounce">
                    {reaction.reaction === 'heart' ? '❤️' : 
                     reaction.reaction === 'clap' ? '👏' : 
                     reaction.reaction === 'wow' ? '😮' : '❤️'}
                  </span>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-bg-hover rounded-full"
                >
                  😊
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-full focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="p-2 bg-accent text-white rounded-full hover:bg-accent/80 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-24 left-4 bg-bg-card border border-border rounded-lg p-2 shadow-lg">
                  <div className="flex gap-2">
                    {['❤️', '👏', '😂', '😮', '🔥', '🎉'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(emoji)}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Send a Tip</h3>
            <p className="text-text-secondary mb-4">
              Support {streamer?.username} with a tip!
            </p>
            
            <div className="flex gap-2 mb-4">
              {[5, 10, 20, 50].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`flex-1 py-2 rounded-lg border ${
                    tipAmount === amount
                      ? 'bg-accent text-white border-accent'
                      : 'border-border hover:bg-bg-hover'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-text-secondary mb-2">
                Custom amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Number(e.target.value))}
                  min="1"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg-secondary"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-bg-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
              >
                Send ${tipAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lock icon component
const Lock = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default LiveStream;

