import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import useWebRTC from '../../hooks/useWebRTC';
import VideoPlayer from '../../components/live/VideoPlayer';
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff,
  MessageCircle, Users, Settings, ChevronLeft, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreatorLive = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState('subscribers');
  const [price, setPrice] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');
  const chatContainerRef = useRef(null);

  const {
    isConnected,
    stream: localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    viewerCount,
    chatMessages,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    leaveStream,
  } = useWebRTC(streamId, user?._id, true);

  // Start preview when component loads
  useEffect(() => {
    startPreview();
    return () => {
      if (streamId) {
        leaveStream();
      }
    };
  }, []);

  const startPreview = async () => {
    try {
      await startLocalStream(true, true);
    } catch (err) {
      console.error('Failed to start preview:', err);
      toast.error('Failed to access camera/microphone');
    }
  };

  const handleCreateStream = async () => {
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post('/streams', {
        title,
        description,
        accessType,
        price: accessType === 'paid' ? price : 0,
      });

      const newStreamId = response.data.data.stream._id;
      setStreamId(newStreamId);

      // Initialize WebRTC connection for broadcasting
      await startLocalStream(true, true);

      toast.success('Stream started!');
    } catch (err) {
      console.error('Failed to create stream:', err);
      toast.error('Failed to start stream');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndStream = async () => {
    if (!streamId) return;

    const confirmed = window.confirm('Are you sure you want to end the stream?');
    if (!confirmed) return;

    try {
      await api.post(`/streams/${streamId}/end`);
      leaveStream();
      navigate('/creator/dashboard');
      toast.success('Stream ended successfully');
    } catch (err) {
      toast.error('Failed to end stream');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  // If no stream created yet, show setup form
  if (!streamId) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <header className="bg-bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-bg-hover rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Go Live</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview */}
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {localStream ? (
                  <VideoPlayer
                    stream={localStream}
                    isLocal={true}
                    muted={true}
                    showControls={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Video className="w-16 h-16 mx-auto mb-2" />
                      <p>Camera preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full ${
                    isAudioEnabled ? 'bg-bg-tertiary' : 'bg-error text-white'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${
                    isVideoEnabled ? 'bg-bg-tertiary' : 'bg-error text-white'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleScreenShare}
                  className={`p-4 rounded-full ${
                    isScreenSharing ? 'bg-accent text-white' : 'bg-bg-tertiary'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stream Details Form */}
            <div className="bg-bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Stream Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your stream a title"
                    maxLength={100}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you'll be streaming"
                    maxLength={2000}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Access</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'free', label: 'Free', icon: '🌐' },
                      { value: 'subscribers', label: 'Subscribers', icon: '👥' },
                      { value: 'paid', label: 'Paid', icon: '💰' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAccessType(option.value)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          accessType === option.value
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:bg-bg-hover'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {accessType === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Price ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateStream}
                  disabled={isCreating || !title.trim()}
                  className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Starting...' : 'Go Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stream is active - show streaming interface
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-error text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-white text-error text-xs font-bold rounded flex items-center gap-1">
              <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
              LIVE
            </span>
            <h1 className="font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{viewerCount}</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                isLive={true}
                viewerCount={viewerCount}
                muted={true}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full ${
                  isAudioEnabled ? 'bg-bg-tertiary' : 'bg-error text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full ${
                  isVideoEnabled ? 'bg-bg-tertiary' : 'bg-error text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleScreenShare}
                className={`p-4 rounded-full ${
                  isScreenSharing ? 'bg-accent text-white' : 'bg-bg-tertiary'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={handleEndStream}
                className="p-4 bg-error text-white rounded-full hover:bg-error/80"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            {/* Stream Info */}
            <div className="bg-bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{title}</h3>
              {description && <p className="text-text-secondary">{description}</p>}
            </div>
          </div>

          {/* Sidebar - Chat */}
          <div className="bg-bg-card border border-border rounded-lg flex flex-col h-[600px]">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'chat' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('viewers')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'viewers' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                Viewers
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-text-muted py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                      <p>Chat messages will appear here</p>
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

                <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Send a message..."
                      className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-full focus:outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-accent text-white rounded-full hover:bg-accent/80"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Viewers Tab */}
            {activeTab === 'viewers' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center text-text-muted py-8">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p>{viewerCount} viewers</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorLive;

