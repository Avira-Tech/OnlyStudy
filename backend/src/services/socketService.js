const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Conversation, Notification, LiveStream } = require('../models');

let io;

// Track active peers in each stream
const streamRooms = new Map(); // streamId -> Set of socket IDs
const peerConnections = new Map(); // socketId -> RTCPeerConnection

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId);
      
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

    // Join creator's room if creator
    if (socket.user.role === 'creator') {
      socket.join(`creator:${socket.userId}`);
    }

    // ==================== MESSAGING ====================
    
    // Join conversation room
    socket.on('join:conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.some(p => p.toString() === socket.userId)) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('joined:conversation', { conversationId });
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', media } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => p.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content,
          messageType,
          media: media || [],
        });

        await message.populate('sender', 'username avatar');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', { message });

        // Send notification to other participant
        const recipientId = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );

        if (recipientId) {
          io.to(`user:${recipientId}`).emit('notification:new', {
            type: 'new_message',
            message: `${socket.user.username} sent you a message`,
            data: { conversationId, messageId: message._id },
          });

          // Update unread count
          const unreadCount = await Message.countDocuments({
            conversation: conversationId,
            sender: { $ne: recipientId },
            isRead: false,
          });
          io.to(`user:${recipientId}`).emit('unread:update', { count: unreadCount });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
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

    // ==================== LIVE STREAMING (WebRTC) ====================

    // Join stream room (for viewers)
    socket.on('stream:join', async (streamId) => {
      try {
        const stream = await LiveStream.findById(streamId);
        
        if (!stream) {
          return socket.emit('stream:error', { message: 'Stream not found' });
        }

        if (stream.status !== 'live') {
          return socket.emit('stream:error', { message: 'Stream is not live' });
        }

        // Initialize room if not exists
        if (!streamRooms.has(streamId)) {
          streamRooms.set(streamId, new Set());
        }

        const room = streamRooms.get(streamId);
        room.add(socket.id);

        // Join socket room
        socket.join(`stream:${streamId}`);

        // Get streamer info
        const streamer = await User.findById(stream.streamer).select('username avatar');

        // Send current viewer count
        io.to(`stream:${streamId}`).emit('stream:viewer-count', { 
          count: room.size 
        });

        // Notify others that a viewer joined
        socket.to(`stream:${streamId}`).emit('stream:viewer-joined', {
          username: socket.user.username,
          userId: socket.userId,
        });

        // Send streamer info to viewer
        socket.emit('stream:joined', {
          streamId,
          streamer,
          viewerCount: room.size,
        });
      } catch (error) {
        console.error('Stream join error:', error);
        socket.emit('stream:error', { message: 'Failed to join stream' });
      }
    });

    // Leave stream
    socket.on('stream:leave', (streamId) => {
      handleStreamLeave(socket, streamId);
    });

    // WebRTC Signaling - Viewer offers to receive stream
    socket.on('webrtc:offer', async (data) => {
      const { streamId, offer } = data;
      
      // Forward offer to the stream room (streamer will handle it)
      socket.to(`stream:${streamId}`).emit('webrtc:offer', {
        offer,
        from: socket.userId,
        username: socket.user.username,
        fromSocketId: socket.id,
      });
    });

    // WebRTC Signaling - Streamer sends answer
    socket.on('webrtc:answer', (data) => {
      const { streamId, answer, targetSocketId } = data;
      
      // Send answer to specific viewer
      io.to(targetSocketId).emit('webrtc:answer', {
        answer,
        from: socket.userId,
      });
    });

    // WebRTC Signaling - ICE candidates
    socket.on('webrtc:ice-candidate', (data) => {
      const { streamId, candidate, targetSocketId } = data;
      
      if (targetSocketId) {
        // Send to specific peer
        io.to(targetSocketId).emit('webrtc:ice-candidate', {
          candidate,
          from: socket.userId,
          fromSocketId: socket.id,
        });
      } else {
        // Broadcast to room
        socket.to(`stream:${streamId}`).emit('webrtc:ice-candidate', {
          candidate,
          from: socket.userId,
          fromSocketId: socket.id,
        });
      }
    });

    // Stream chat message
    socket.on('stream:chat', async (data) => {
      try {
        const { streamId, content } = data;
        
        io.to(`stream:${streamId}`).emit('stream:chat', {
          userId: socket.userId,
          username: socket.user.username,
          avatar: socket.user.avatar,
          content,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send chat message' });
      }
    });

    // Stream like/reaction
    socket.on('stream:reaction', (data) => {
      const { streamId, reaction } = data;
      
      io.to(`stream:${streamId}`).emit('stream:reaction', {
        userId: socket.userId,
        username: socket.user.username,
        reaction, // 'heart', 'clap', 'wow', etc.
        timestamp: new Date(),
      });
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      
      // Clean up stream rooms
      streamRooms.forEach((room, streamId) => {
        if (room.has(socket.id)) {
          handleStreamLeave(socket, streamId);
        }
      });
    });
  });

  return io;
};

// Helper function to handle stream leave
const handleStreamLeave = (socket, streamId) => {
  const room = streamRooms.get(streamId);
  if (room) {
    room.delete(socket.id);
    socket.leave(`stream:${streamId}`);
    
    // Update viewer count
    io.to(`stream:${streamId}`).emit('stream:viewer-count', { 
      count: room.size 
    });

    // Notify others
    socket.to(`stream:${streamId}`).emit('stream:viewer-left', {
      username: socket.user.username,
      userId: socket.userId,
    });

    // Clean up empty rooms
    if (room.size === 0) {
      streamRooms.delete(streamId);
    }
  }
};

// Send notification to user
const sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};

// Send notification to multiple users
const sendBulkNotification = (userIds, notification) => {
  if (io) {
    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit('notification:new', notification);
    });
  }
};

// Broadcast to all connected sockets
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Broadcast to specific stream room
const broadcastToStream = (streamId, event, data) => {
  if (io) {
    io.to(`stream:${streamId}`).emit(event, data);
  }
};

// Notify all users about new live stream
const notifyNewStream = async (stream) => {
  if (io) {
    const { User, Subscription } = require('../models');
    
    const subscribers = await Subscription.find({
      creator: stream.streamer,
      status: 'active',
    }).select('subscriber');

    const streamer = await User.findById(stream.streamer).select('username avatar');

    subscribers.forEach((sub) => {
      io.to(`user:${sub.subscriber}`).emit('notification:new', {
        type: 'live_stream_started',
        title: 'Live Stream Started',
        message: `${streamer.username} is now live!`,
        data: { streamId: stream._id },
        link: `/live/${stream._id}`,
      });
    });

    // Also broadcast to explore page
    io.emit('stream:new', {
      streamId: stream._id,
      title: stream.title,
      streamer,
    });
  }
};

module.exports = {
  initializeSocket,
  sendNotification,
  sendBulkNotification,
  broadcast,
  broadcastToStream,
  notifyNewStream,
  getIO: () => io,
  ICE_SERVERS,
};

