import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// ICE server configuration for WebRTC
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useWebRTC = (streamId, userId, isStreamer = false) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [error, setError] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !streamId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join the stream room
      newSocket.emit('stream:join', streamId);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('stream:error', (data) => {
      console.error('Stream error:', data.message);
      setError(data.message);
    });

    newSocket.on('stream:viewer-count', (data) => {
      setViewerCount(data.count);
    });

    newSocket.on('stream:chat', (data) => {
      setChatMessages((prev) => [...prev.slice(-100), data]);
    });

    newSocket.on('stream:reaction', (data) => {
      setReactions((prev) => [...prev.slice(-20), data]);
      // Auto-remove reaction after animation
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r !== data));
      }, 3000);
    });

    // WebRTC handlers for viewers
    if (!isStreamer) {
      newSocket.on('webrtc:offer', async (data) => {
        console.log('Received offer from streamer');
        
        // Create peer connection if not exists
        if (!peerConnectionRef.current) {
          await createPeerConnection(newSocket, streamId);
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        newSocket.emit('webrtc:answer', {
          streamId,
          answer,
          targetSocketId: data.fromSocketId,
        });
      });

      newSocket.on('webrtc:answer', async (data) => {
        console.log('Received answer');
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      });

      newSocket.on('webrtc:ice-candidate', async (data) => {
        if (data.candidate) {
          await peerConnectionRef.current?.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      });
    }

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      newSocket.disconnect();
    };
  }, [streamId, isStreamer]);

  // Create peer connection
  const createPeerConnection = useCallback(async (socketInstance, currentStreamId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks (for viewers receiving streamer's video)
    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketInstance.emit('webrtc:ice-candidate', {
          streamId: currentStreamId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    return pc;
  }, []);

  // Start local media stream
  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720, facingMode: 'user' } : false,
        audio,
      });

      localStreamRef.current = userMediaStream;
      setStream(userMediaStream);
      setIsAudioEnabled(audio);
      setIsVideoEnabled(video);

      // If peer connection exists, add tracks
      if (peerConnectionRef.current) {
        userMediaStream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, userMediaStream);
        });
      }

      return userMediaStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone');
      throw err;
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Replace video track in peer connection
      const videoTrack = screenStream.getVideoTracks()[0];
      
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare();
      };

      return screenStream;
    } catch (err) {
      console.error('Error starting screen share:', err);
      throw err;
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    // Restore camera video
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((content) => {
    if (socket && content.trim()) {
      socket.emit('stream:chat', { streamId, content });
    }
  }, [socket, streamId]);

  // Send reaction
  const sendReaction = useCallback((reaction) => {
    if (socket) {
      socket.emit('stream:reaction', { streamId, reaction });
    }
  }, [socket, streamId]);

  // Send offer (for streamer to initiate WebRTC)
  const sendOffer = useCallback(async () => {
    if (!socket || !peerConnectionRef.current) return;

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    socket.emit('webrtc:offer', {
      streamId,
      offer,
    });
  }, [socket, streamId]);

  // Leave stream
  const leaveStream = useCallback(() => {
    if (socket) {
      socket.emit('stream:leave', streamId);
      socket.disconnect();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [socket, streamId]);

  return {
    socket,
    isConnected,
    stream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    viewerCount,
    chatMessages,
    reactions,
    error,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    sendReaction,
    sendOffer,
    leaveStream,
  };
};

export default useWebRTC;

