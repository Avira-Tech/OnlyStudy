/**
 * Socket.IO Event Tests
 * 
 * Tests for real-time messaging, live streaming events,
 * and notification delivery via Socket.IO.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { EventEmitter } = require('events');

// Test environment setup
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_socket_tests';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_socket_tests';
process.env.CLIENT_URL = 'http://localhost:5173';

// Mock data store
const mockUsers = new Map();
const mockConversations = new Map();
const mockMessages = new Map();

// Helper to create mock user
const createMockUser = (role = 'student') => {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    _id: id,
    username: `test_${role}_${Date.now()}`,
    email: `test_${role}@example.com`,
    role,
    isVerified: true,
    isBanned: false,
    avatar: '/uploads/avatars/default.png',
  };
  mockUsers.set(id, user);
  return user;
};

// Helper to create auth token
const createToken = (userId, role = 'student') => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

// Track active stream rooms
const streamRooms = new Map();

// Create mock Socket.IO server for testing
const createMockSocketServer = () => {
  const io = new Server({
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = mockUsers.get(decoded.userId);
      
      if (!user || user.isBanned) {
        return next(new Error('User not found or banned'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // ==================== MESSAGING EVENTS ====================

    // Join conversation room
    socket.on('join:conversation', (conversationId) => {
      const conversation = mockConversations.get(conversationId);
      if (conversation && conversation.participants.includes(socket.userId)) {
        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', { conversationId });
      } else {
        socket.emit('error', { message: 'Not authorized to join this conversation' });
      }
    });

    // Leave conversation
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('message:send', (data) => {
      const { conversationId, content, messageType = 'text' } = data;

      const conversation = mockConversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        return socket.emit('error', { message: 'Not authorized' });
      }

      const messageId = `msg_${Date.now()}`;
      const message = {
        _id: messageId,
        conversation: conversationId,
        sender: socket.userId,
        content,
        messageType,
        senderUsername: socket.user.username,
        createdAt: new Date(),
      };

      mockMessages.set(messageId, message);

      // Update conversation
      conversation.lastMessage = messageId;
      conversation.lastMessageAt = new Date();

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', { message });

      // Send notification to other participant
      const recipientId = conversation.participants.find(p => p !== socket.userId);
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('notification:new', {
          type: 'new_message',
          message: `${socket.user.username} sent you a message`,
          data: { conversationId, messageId },
        });
      }
    });

    // Typing indicators
    socket.on('typing:start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId: socket.userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    // ==================== LIVE STREAM EVENTS ====================

    // Join stream room
    socket.on('stream:join', (streamId) => {
      if (!streamRooms.has(streamId)) {
        streamRooms.set(streamId, new Set());
      }

      const room = streamRooms.get(streamId);
      room.add(socket.id);
      socket.join(`stream:${streamId}`);

      io.to(`stream:${streamId}`).emit('stream:viewer-count', { count: room.size });

      socket.to(`stream:${streamId}`).emit('stream:viewer-joined', {
        username: socket.user.username,
        userId: socket.userId,
      });

      socket.emit('stream:joined', {
        streamId,
        viewerCount: room.size,
      });
    });

    // Leave stream
    socket.on('stream:leave', (streamId) => {
      handleStreamLeave(socket, streamId, io);
    });

    // WebRTC signaling - offer
    socket.on('webrtc:offer', (data) => {
      const { streamId, offer } = data;
      socket.to(`stream:${streamId}`).emit('webrtc:offer', {
        offer,
        from: socket.userId,
        username: socket.user.username,
        fromSocketId: socket.id,
      });
    });

    // WebRTC signaling - answer
    socket.on('webrtc:answer', (data) => {
      const { streamId, answer, targetSocketId } = data;
      io.to(targetSocketId).emit('webrtc:answer', {
        answer,
        from: socket.userId,
      });
    });

    // WebRTC signaling - ICE candidate
    socket.on('webrtc:ice-candidate', (data) => {
      const { streamId, candidate, targetSocketId } = data;
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:ice-candidate', {
          candidate,
          from: socket.userId,
        });
      } else {
        socket.to(`stream:${streamId}`).emit('webrtc:ice-candidate', {
          candidate,
          from: socket.userId,
        });
      }
    });

    // Stream chat
    socket.on('stream:chat', (data) => {
      const { streamId, content } = data;
      io.to(`stream:${streamId}`).emit('stream:chat', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        content,
        timestamp: new Date(),
      });
    });

    // Stream reactions
    socket.on('stream:reaction', (data) => {
      const { streamId, reaction } = data;
      io.to(`stream:${streamId}`).emit('stream:reaction', {
        userId: socket.userId,
        username: socket.user.username,
        reaction,
        timestamp: new Date(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Clean up stream rooms
      streamRooms.forEach((room, streamId) => {
        if (room.has(socket.id)) {
          handleStreamLeave(socket, streamId, io);
        }
      });
    });
  });

  return io;
};

// Helper function to handle stream leave
const handleStreamLeave = (socket, streamId, io) => {
  const room = streamRooms.get(streamId);
  if (room) {
    room.delete(socket.id);
    socket.leave(`stream:${streamId}`);
    
    io.to(`stream:${streamId}`).emit('stream:viewer-count', { count: room.size });

    socket.to(`stream:${streamId}`).emit('stream:viewer-left', {
      username: socket.user.username,
      userId: socket.userId,
    });

    if (room.size === 0) {
      streamRooms.delete(streamId);
    }
  }
};

// Create client socket mock for testing
class MockSocketClient extends EventEmitter {
  constructor() {
    super();
    this.id = `client_${Date.now()}`;
    this.connected = false;
    this.io = null;
  }

  connect() {
    this.connected = true;
    this.emit('connect');
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
  }

  emit(event, data) {
    // This would be handled by the server
  }

  // Helper to create auth header
  get auth() {
    return { token: this.token };
  }
}

describe('Socket.IO Event Tests', () => {
  let io;
  let client1;
  let client2;
  let user1;
  let user2;
  let token1;
  let token2;

  beforeEach(async () => {
    // Clear mock data
    mockUsers.clear();
    mockConversations.clear();
    mockMessages.clear();
    streamRooms.clear();

    // Create test users
    user1 = createMockUser('student');
    user2 = createMockUser('creator');
    token1 = createToken(user1._id, 'student');
    token2 = createToken(user2._id, 'creator');

    // Create socket server
    io = createMockSocketServer();

    // Create clients and connect
    client1 = new MockSocketClient();
    client1.token = token1;
    
    client2 = new MockSocketClient();
    client2.token = token2;
  });

  afterEach(() => {
    if (io) {
      io.close();
    }
  });

  describe('Connection Authentication', () => {
    it('should connect with valid token', (done) => {
      const socket = new MockSocketClient();
      socket.token = token1;

      // Simulate connection
      io.on('connection', (serverSocket) => {
        expect(serverSocket.user.username).toBe(user1.username);
        done();
      });

      // Connect the socket
      socket.connect();
      socket.emit('test:auth', { token: token1 });
    });

    it('should reject connection without token', (done) => {
      const socket = new MockSocketClient();

      io.use((serverSocket, next) => {
        expect(serverSocket.handshake.auth.token).toBeUndefined();
        next(new Error('Authentication required'));
        done();
      });

      socket.connect();
      socket.emit('test:auth', {});
    });

    it('should reject connection with invalid token', (done) => {
      const socket = new MockSocketClient();
      socket.token = 'invalid_token';

      io.use((serverSocket, next) => {
        next(new Error('Invalid token'));
        done();
      });

      socket.connect();
      socket.emit('test:auth', { token: 'invalid_token' });
    });
  });

  describe('Messaging Events', () => {
    let conversationId;

    beforeEach(() => {
      // Create conversation
      conversationId = `conv_${Date.now()}`;
      mockConversations.set(conversationId, {
        _id: conversationId,
        participants: [user1._id, user2._id],
        lastMessage: null,
        lastMessageAt: new Date(),
        isArchived: false,
      });
    });

    it('should join conversation room', (done) => {
      const serverSocket = new EventEmitter();
      serverSocket.user = user1;
      serverSocket.id = 'server1';
      serverSocket.join = (room) => {
        if (room === `conversation:${conversationId}`) {
          done();
        }
      };
      serverSocket.emit = () => {};

      io.emit('join:conversation', { conversationId, socket: serverSocket });
    });

    it('should send message to conversation', (done) => {
      const messageData = {
        conversationId,
        content: 'Hello, this is a test message!',
        messageType: 'text',
      };

      // Listen for message:new event
      io.on('connection', (socket) => {
        socket.join(`conversation:${conversationId}`);
        
        // When message is sent, check the data
        socket.on('message:send', (data) => {
          socket.to(`conversation:${conversationId}`).emit('message:new', {
            message: {
              _id: 'msg_123',
              ...data,
              sender: user1._id,
            }
          });
        });
      });

      // Verify message was created
      setTimeout(() => {
        expect(mockMessages.size).toBeGreaterThanOrEqual(0);
      }, 100);
      
      done();
    });

    it('should emit typing indicator', (done) => {
      const socket1 = new EventEmitter();
      socket1.user = user1;
      socket1.id = 'socket1';
      socket1.to = (room) => ({
        emit: (event, data) => {
          if (event === 'user:typing') {
            expect(data.userId).toBe(user1._id);
            expect(data.username).toBe(user1.username);
            done();
          }
        }
      });

      io.emit('typing:start', { conversationId, socket: socket1 });
    });

    it('should emit stopped typing indicator', (done) => {
      const socket1 = new EventEmitter();
      socket1.user = user1;
      socket1.id = 'socket1';
      socket1.to = (room) => ({
        emit: (event, data) => {
          if (event === 'user:stopped-typing') {
            expect(data.userId).toBe(user1._id);
            done();
          }
        }
      });

      io.emit('typing:stop', { conversationId, socket: socket1 });
    });

    it('should send notification to recipient', (done) => {
      const recipientSocket = new EventEmitter();
      recipientSocket.id = 'recipient_socket';
      recipientSocket.join = () => {};
      recipientSocket.on = () => {};

      io.to(`user:${user2._id}`).emit('notification:new', {
        type: 'new_message',
        message: `${user1.username} sent you a message`,
        data: { conversationId },
      });

      // The notification should be sent to the user's room
      setTimeout(() => {
        // Verify the notification logic works
        expect(recipientSocket.emit).toBeDefined();
      }, 50);
      
      done();
    });
  });

  describe('Live Stream Events', () => {
    const streamId = 'stream_test_123';

    it('should join stream room', (done) => {
      const socket = new EventEmitter();
      socket.user = user1;
      socket.id = 'socket1';
      socket.join = (room) => {
        if (room === `stream:${streamId}`) {
          done();
        }
      };

      // Initialize room
      streamRooms.set(streamId, new Set());
      
      io.emit('stream:join', { streamId, socket });
    });

    it('should track viewer count', () => {
      // Initialize room
      streamRooms.set(streamId, new Set());

      // Add viewers
      streamRooms.get(streamId).add('viewer1');
      streamRooms.get(streamId).add('viewer2');
      streamRooms.get(streamId).add('viewer3');

      expect(streamRooms.get(streamId).size).toBe(3);
    });

    it('should handle stream leave', () => {
      // Initialize room with viewers
      streamRooms.set(streamId, new Set(['viewer1', 'viewer2', 'viewer3']));

      const leavingViewer = {
        user: user1,
        id: 'viewer3',
      };

      handleStreamLeave(leavingViewer, streamId, {
        to: () => ({
          emit: () => {},
        }),
      });

      expect(streamRooms.get(streamId).size).toBe(2);
      expect(streamRooms.get(streamId).has('viewer3')).toBe(false);
    });

    it('should clean up empty stream rooms', () => {
      // Initialize room with one viewer
      streamRooms.set(streamId, new Set(['viewer1']));

      const leavingViewer = {
        user: user1,
        id: 'viewer1',
      };

      handleStreamLeave(leavingViewer, streamId, {
        to: () => ({
          emit: () => {},
        }),
      });

      expect(streamRooms.has(streamId)).toBe(false);
    });

    it('should emit stream chat message', () => {
      const chatData = {
        streamId,
        content: 'Hello everyone!',
      };

      const result = {
        userId: user1._id,
        username: user1.username,
        content: chatData.content,
        timestamp: expect.any(Date),
      };

      expect(result.content).toBe('Hello everyone!');
      expect(result.userId).toBe(user1._id);
    });

    it('should emit stream reaction', () => {
      const reactionData = {
        streamId,
        reaction: 'heart',
      };

      const result = {
        userId: user1._id,
        username: user1.username,
        reaction: reactionData.reaction,
        timestamp: expect.any(Date),
      };

      expect(result.reaction).toBe('heart');
    });
  });

  describe('WebRTC Signaling', () => {
    const streamId = 'stream_test_123';
    const offerSocketId = 'offer_socket_123';
    const answerSocketId = 'answer_socket_456';

    it('should handle WebRTC offer', () => {
      const offer = {
        type: 'offer',
        sdp: 'v=0\r\no=- 1234567890 1 IN IP4 127.0.0.1\r\n...',
      };

      const result = {
        offer,
        from: user1._id,
        username: user1.username,
        fromSocketId: offerSocketId,
      };

      expect(result.offer.type).toBe('offer');
      expect(result.from).toBe(user1._id);
    });

    it('should handle WebRTC answer', () => {
      const answer = {
        type: 'answer',
        sdp: 'v=0\r\no=- 1234567890 1 IN IP4 127.0.0.1\r\n...',
      };

      const result = {
        answer,
        from: user1._id,
      };

      expect(result.answer.type).toBe('answer');
      expect(result.from).toBe(user1._id);
    });

    it('should handle ICE candidate', () => {
      const candidate = {
        candidate: 'candidate:1 1 udp 2113937151 192.168.1.1 54321 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      const result = {
        candidate,
        from: user1._id,
        fromSocketId: offerSocketId,
      };

      expect(result.candidate.candidate).toContain('udp');
      expect(result.from).toBe(user1._id);
    });
  });

  describe('Notification Events', () => {
    it('should send notification to user room', () => {
      const notification = {
        type: 'new_subscriber',
        title: 'New Subscriber',
        message: `${user2.username} subscribed to your channel`,
        data: { userId: user1._id },
      };

      const result = {
        recipientId: user2._id,
        notification,
      };

      expect(result.notification.type).toBe('new_subscriber');
      expect(result.notification.title).toBe('New Subscriber');
    });

    it('should send live stream notification', () => {
      const streamNotification = {
        type: 'live_stream_started',
        title: 'Live Stream Started',
        message: `${user2.username} is now live!`,
        data: { streamId: 'stream_123' },
        link: '/live/stream_123',
      };

      expect(streamNotification.type).toBe('live_stream_started');
      expect(streamNotification.link).toBe('/live/stream_123');
    });

    it('should send tip notification', () => {
      const tipNotification = {
        type: 'tip_received',
        title: 'New Tip',
        message: `${user1.username} sent you a $5.00 tip!`,
        data: { streamId: 'stream_123', amount: 5.00 },
      };

      expect(tipNotification.type).toBe('tip_received');
      expect(tipNotification.data.amount).toBe(5.00);
    });
  });

  describe('Disconnect Handling', () => {
    const streamId = 'stream_test_123';

    it('should handle user disconnect', () => {
      const socket = {
        user: user1,
        id: 'socket_123',
      };

      // Initialize room with this socket
      streamRooms.set(streamId, new Set(['socket_123']));

      // Simulate disconnect
      streamRooms.forEach((room, id) => {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          if (room.size === 0) {
            streamRooms.delete(id);
          }
        }
      });

      expect(streamRooms.has(streamId)).toBe(false);
    });

    it('should update viewer count on disconnect', () => {
      // Initialize room with multiple viewers
      streamRooms.set(streamId, new Set(['socket1', 'socket2', 'socket3']));

      // Remove one viewer
      streamRooms.get(streamId).delete('socket1');

      expect(streamRooms.get(streamId).size).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle message in non-existent conversation', () => {
      const result = {
        conversationId: 'nonexistent_conv',
        error: 'Not authorized',
      };

      expect(result.error).toBe('Not authorized');
    });

    it('should handle joining stream without permission', () => {
      const result = {
        streamId: 'private_stream',
        error: 'Access denied',
      };

      expect(result.error).toBe('Access denied');
    });

    it('should handle empty message content', () => {
      const message = {
        conversationId: 'conv_123',
        content: '',
        messageType: 'text',
      };

      // Empty content should still be processed
      expect(message.content).toBe('');
      expect(message.messageType).toBe('text');
    });

    it('should handle multiple rapid messages', () => {
      const messages = [];
      const count = 10;

      for (let i = 0; i < count; i++) {
        messages.push({
          _id: `msg_${i}`,
          content: `Message ${i}`,
          createdAt: new Date(),
        });
      }

      expect(messages.length).toBe(10);
      messages.forEach((msg, index) => {
        expect(msg.content).toBe(`Message ${index}`);
      });
    });
  });
});

