
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical, 
  Image, Video, FileText, Calendar, Loader2, Lock, Unlock,
  Archive, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreatorPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showMenu, setShowMenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchPosts() }, [filter, pagination.page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await api.get(`/posts/creator/me?status=${status || ''}&page=${pagination.page}&limit=20`);
      setPosts(res.data.data?.posts || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data?.pagination?.total || 0,
        pages: res.data.data?.pagination?.pages || 1
      }));
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/posts/${postId}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
    setShowMenu(null);
  };

  const handleToggleVisibility = async (post) => {
    try {
      // Toggle visibility - if published, archive it, if archived, publish it
      const newStatus = post.status === 'published' ? 'archived' : 'published';
      await api.put(`/posts/${post._id}`, { status: newStatus });
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'archived'}`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
    setShowMenu(null);
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(search.toLowerCase()) ||
    post.content?.toLowerCase().includes(search.toLowerCase())
  );

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      archived: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || styles.draft;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Posts</h1>
          <p className="text-text-secondary">Manage your content and posts</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/creator/new-post"
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" /> Create Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: pagination.total, color: 'text-text-primary' },
          { label: 'Published', value: posts.filter(p => p.status === 'published').length, color: 'text-success' },
          { label: 'Drafts', value: posts.filter(p => p.status === 'draft').length, color: 'text-text-muted' },
          { label: 'Total Views', value: posts.reduce((acc, p) => acc + (p.views || 0), 0), color: 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'published', 'draft', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => { setFilter(status); setPagination(prev => ({ ...prev, page: 1 })); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === status
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-bg-card rounded-lg border border-border">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted mb-4">No posts found</p>
            <Link 
              to="/creator/new-post"
              className="text-accent hover:text-accent-hover"
            >
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPosts.map((post) => (
              <div key={post._id} className="p-4 flex items-start justify-between hover:bg-bg-hover/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.media?.[0]?.type === 'image' ? (
                      <img src={post.media[0].url} alt="" className="h-full w-full object-cover" />
                    ) : post.media?.[0]?.type === 'video' ? (
                      <Video className="h-6 w-6 text-text-muted" />
                    ) : (
                      <FileText className="h-6 w-6 text-text-muted" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-text-primary truncate">
                        {post.title || 'Untitled Post'}
                      </h3>
                      {post.isFree ? (
                        <Unlock className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-text-muted flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-text-muted truncate mb-2">
                      {post.content?.substring(0, 80) || 'No content'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        {getContentIcon(post.contentType)}
                        {post.contentType || 'text'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusBadge(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(post)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.status === 'published' 
                        ? 'text-success hover:bg-green-50' 
                        : 'text-text-muted hover:bg-bg-tertiary'
                    }`}
                    title={post.status === 'published' ? 'Archive' : 'Publish'}
                  >
                    <ToggleRight className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === post._id ? null : post._id)}
                      className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {showMenu === post._id && (
                      <div className="absolute right-0 mt-1 w-48 bg-bg-card border border-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => { navigate(`/creator/new-post?edit=${post._id}`); setShowMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-left"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-error text-left"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-hover"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-hover"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorPosts;

