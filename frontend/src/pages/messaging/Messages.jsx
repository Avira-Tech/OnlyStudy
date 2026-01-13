
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { 
  Search, Send, MoreVertical, Paperclip, Image, 
  Smile, ArrowLeft, Phone, Video, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const Messages = () => {
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
      joinConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (id) => {
    try {
      const response = await api.get(`/messages/conversations/${id}/messages`);
      setMessages(response.data.data.messages);
      
      const convResponse = await api.get('/messages/conversations');
      const conv = convResponse.data.data.conversations.find(c => c._id === id);
      setSelectedConversation(conv);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const joinConversation = (id) => {
    // Socket events handled in useEffect
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await api.post(`/messages/conversations/${selectedConversation._id}/messages`, {
        content: newMessage,
        messageType: 'text',
      });

      setMessages([...messages, response.data.data.message]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find(p => p._id !== user._id);
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return other.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-bg-card flex flex-col ${
        conversationId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <User className="w-12 h-12 mx-auto mb-2" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isSelected = selectedConversation?._id === conv._id;
              
              return (
                <Link
                  key={conv._id}
                  to={`/messages/${conv._id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-bg-hover transition-colors ${
                    isSelected ? 'bg-bg-tertiary' : ''
                  }`}
                >
                  <img
                    src={other?.avatar || '/default-avatar.png'}
                    alt={other?.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{other?.username}</span>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-text-muted truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {!conv.isRead && conv.lastMessage?.sender !== user._id && (
                    <span className="w-2 h-2 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
        {conversationId && selectedConversation ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between bg-bg-card">
              <div className="flex items-center gap-3">
                <Link
                  to="/messages"
                  className="md:hidden p-2 hover:bg-bg-hover rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <img
                  src={getOtherParticipant(selectedConversation)?.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold">
                    {getOtherParticipant(selectedConversation)?.username}
                  </h2>
                  <span className="text-xs text-text-muted">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-bg-hover rounded-full">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-bg-hover rounded-full">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-bg-hover rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-primary">
              {messages.map((message, index) => {
                const isOwn = message.sender._id === user._id;
                
                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <img
                          src={message.sender.avatar || '/default-avatar.png'}
                          alt={message.sender.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-accent text-white rounded-br-md'
                              : 'bg-bg-card border border-border rounded-bl-md'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <p className={`text-xs text-text-muted mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-bg-card">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 hover:bg-bg-hover rounded-full text-text-muted">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 hover:bg-bg-hover rounded-full text-text-muted">
                  <Image className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-bg-secondary border border-border rounded-full focus:outline-none focus:border-accent"
                />
                <button type="button" className="p-2 hover:bg-bg-hover rounded-full text-text-muted">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-accent text-white rounded-full hover:bg-accent/80 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Your Messages</h3>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;

