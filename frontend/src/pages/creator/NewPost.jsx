import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Image, Video, FileText, Globe, Lock, Users, 
  DollarSign, X, Plus, Loader2, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewPost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [accessType, setAccessType] = useState('public');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = [...media];
    const newPreviews = [...mediaPreviews];

    files.forEach((file) => {
      if (newMedia.length >= 5) return;
      
      newMedia.push(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({ type: 'image', url: e.target.result });
          setMediaPreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newPreviews.push({ type: 'video', url });
        setMediaPreviews([...newPreviews]);
      }
    });

    setMedia(newMedia);
  };

  const removeMedia = (index) => {
    const newMedia = media.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMedia(newMedia);
    setMediaPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim() && media.length === 0) {
      toast.error('Please add some content');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('accessType', accessType);
      
      if (accessType === 'paid' && price) {
        formData.append('price', parseFloat(price));
      }

      media.forEach((file) => {
        formData.append('media', file);
      });

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Post created successfully!');
      navigate(`/creator/posts`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accessOptions = [
    {
      id: 'public',
      icon: Globe,
      label: 'Public',
      description: 'Everyone can see this post',
    },
    {
      id: 'subscribers',
      icon: Users,
      label: 'Subscribers Only',
      description: 'Only your subscribers can see this post',
    },
    {
      id: 'paid',
      icon: DollarSign,
      label: 'Paid Content',
      description: 'Users pay to access this content',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, knowledge, or updates..."
            rows={8}
            className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Media (Max 5)</label>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-accent transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaChange}
                className="hidden"
              />
              <Plus className="w-6 h-6 text-text-secondary" />
            </label>
            
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden">
                {preview.type === 'image' ? (
                  <img
                    src={preview.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Access Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Who can see this post?</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {accessOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setAccessType(option.id);
                  if (option.id !== 'paid') setPrice('');
                }}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  accessType === option.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:bg-bg-hover'
                }`}
              >
                <option.icon className="w-5 h-5 mb-2" />
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-text-secondary">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Price Input (for paid content) */}
        {accessType === 'paid' && (
          <div>
            <label className="block text-sm font-medium mb-2">Price ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4.99"
                min="0.99"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-border rounded-lg hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPost;

