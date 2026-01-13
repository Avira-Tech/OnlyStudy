
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Image, Video, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const PostCard = ({ post, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/posts/${post._id}/like`);
        setLikeCount(prev => prev - 1);
      } else {
        await api.post(`/posts/${post._id}/like`);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await api.delete(`/posts/${post._id}/save`);
      } else {
        await api.post(`/posts/${post._id}/save`);
      }
      setIsSaved(!isSaved);
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post._id}/share`);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to share post');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/posts/${post._id}/comments`, {
        content: newComment,
      });
      post.comments = [response.data.data.comment, ...post.comments];
      setNewComment('');
      toast.success('Comment added');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getAccessBadge = () => {
    switch (post.accessType) {
      case 'subscribers': return <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Subscribers</span>;
      case 'paid': return <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">${post.price}</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/creator/${post.creator?.username}`}>
            <img
              src={post.creator?.avatar || '/default-avatar.png'}
              alt={post.creator?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link to={`/creator/${post.creator?.username}`} className="font-medium hover:text-accent">
              {post.creator?.username}
            </Link>
            <p className="text-xs text-text-muted">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-bg-hover rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-bg-card border border-border rounded-lg shadow-lg py-1 z-10">
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-bg-hover">
                Report
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-bg-hover">
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {getAccessBadge()}
        <h3 className="font-semibold mt-2">{post.title}</h3>
        <p className="text-text-secondary text-sm mt-1 line-clamp-3">{post.content}</p>
      </div>

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="mt-3">
          {post.media.length === 1 ? (
            <img
              src={post.media[0].url}
              alt="Post media"
              className="w-full max-h-96 object-contain bg-black"
            />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {post.media.slice(0, 4).map((media, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">+{post.media.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between border-t border-border mt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-text-secondary'} hover:text-red-500`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-text-secondary hover:text-accent"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.commentCount || post.comments?.length || 0}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-text-secondary hover:text-accent"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`${isSaved ? 'text-accent' : 'text-text-secondary'} hover:text-accent`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border p-4 bg-bg-secondary">
          <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-bg-card border border-border rounded-full text-sm focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-accent text-white rounded-full text-sm hover:bg-accent/80 disabled:opacity-50"
            >
              Post
            </button>
          </form>

          <div className="space-y-3">
            {post.comments?.slice(0, 3).map((comment) => (
              <div key={comment._id} className="flex gap-2">
                <img
                  src={comment.user?.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-bg-card border border-border rounded-lg px-3 py-2">
                    <span className="font-medium text-sm">{comment.user?.username}</span>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-text-muted mt-1 ml-2">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;

