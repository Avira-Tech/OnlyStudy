// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import useAuthStore from '../../store/authStore'
// import api from '../../services/api'
// import { Heart, MessageCircle, Eye, Clock, User, Play } from 'lucide-react'
// import toast from 'react-hot-toast'

// const StudentHome = () => {
//   const [feed, setFeed] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [liveStreams, setLiveStreams] = useState([])
//   const { user } = useAuthStore()

//   useEffect(() => {
//     fetchFeed()
//     fetchLiveStreams()
//   }, [])

//   const fetchFeed = async () => {
//     try {
//       const response = await api.get('/posts/feed')
//       setFeed(response.data.data.posts)
//     } catch (error) {
//       toast.error('Failed to load feed')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchLiveStreams = async () => {
//     try {
//       const response = await api.get('/streams')
//       setLiveStreams(response.data.data.streams.filter(stream => stream.isLive))
//     } catch (error) {
//       console.error('Failed to load live streams')
//     }
//   }

//   const handleLike = async (postId) => {
//     try {
//       await api.post(`/posts/${postId}/like`)
//       // Update local state
//       setFeed(feed.map(post =>
//         post._id === postId
//           ? { ...post, likes: post.likes.includes(user._id) ? post.likes.filter(id => id !== user._id) : [...post.likes, user._id] }
//           : post
//       ))
//     } catch (error) {
//       toast.error('Failed to like post')
//     }
//   }

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//     })
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.username}!</h1>
//         <p className="text-gray-600">Discover new content from creators you follow</p>
//       </div>

//       {/* Live Streams Section */}
//       {liveStreams.length > 0 && (
//         <div className="mb-8">
//           <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
//             <Play className="h-6 w-6 text-red-500 mr-2" />
//             Live Now
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {liveStreams.slice(0, 3).map((stream) => (
//               <Link
//                 key={stream._id}
//                 to={`/live/${stream._id}`}
//                 className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
//               >
//                 <div className="aspect-video bg-gray-200 relative">
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <Play className="h-12 w-12 text-white bg-red-500 rounded-full p-3" />
//                   </div>
//                   <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
//                     LIVE
//                   </div>
//                   <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
//                     {stream.viewerCount || 0} watching
//                   </div>
//                 </div>
//                 <div className="p-4">
//                   <h3 className="font-semibold text-gray-900 mb-1">{stream.title}</h3>
//                   <p className="text-sm text-gray-600">{stream.creator.username}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Feed */}
//       <div className="space-y-6">
//         {feed.length === 0 ? (
//           <div className="text-center py-12">
//             <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-xl font-medium text-gray-900 mb-2">No posts yet</h3>
//             <p className="text-gray-600 mb-4">Follow some creators to see their content here</p>
//             <Link
//               to="/explore"
//               className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
//             >
//               Explore Creators
//             </Link>
//           </div>
//         ) : (
//           feed.map((post) => (
//             <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden">
//               {/* Post Header */}
//               <div className="p-4 border-b border-gray-200">
//                 <div className="flex items-center space-x-3">
//                   <img
//                     src={post.author.avatar || '/default-avatar.png'}
//                     alt={post.author.username}
//                     className="h-10 w-10 rounded-full"
//                   />
//                   <div>
//                     <Link
//                       to={`/creator/${post.author.username}`}
//                       className="font-semibold text-gray-900 hover:text-blue-600"
//                     >
//                       {post.author.username}
//                     </Link>
//                     <div className="flex items-center text-sm text-gray-500">
//                       <Clock className="h-4 w-4 mr-1" />
//                       {formatDate(post.publishedAt)}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Post Content */}
//               <div className="p-4">
//                 {post.title && (
//                   <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
//                 )}

//                 <div className="text-gray-700 mb-4 whitespace-pre-wrap">
//                   {post.content.length > 300 ? (
//                     <>
//                       {post.content.substring(0, 300)}...
//                       <button className="text-blue-600 hover:text-blue-700 ml-1">
//                         Read more
//                       </button>
//                     </>
//                   ) : (
//                     post.content
//                   )}
//                 </div>

//                 {/* Media */}
//                 {post.media && post.media.length > 0 && (
//                   <div className="mb-4">
//                     {post.media.map((media, index) => (
//                       <div key={index} className="rounded-lg overflow-hidden">
//                         {media.type === 'image' ? (
//                           <img
//                             src={media.url}
//                             alt={media.publicId || 'Post media'}
//                             className="w-full h-auto"
//                           />
//                         ) : (
//                           <video
//                             src={media.url}
//                             controls
//                             className="w-full h-auto"
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Post Actions */}
//                 <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//                   <div className="flex items-center space-x-6">
//                     <button
//                       onClick={() => handleLike(post._id)}
//                       className={`flex items-center space-x-2 ${
//                         post.likes.includes(user._id) ? 'text-red-500' : 'text-gray-500'
//                       } hover:text-red-500 transition-colors`}
//                     >
//                       <Heart className={`h-5 w-5 ${post.likes.includes(user._id) ? 'fill-current' : ''}`} />
//                       <span>{post.likes.length}</span>
//                     </button>
//                     <div className="flex items-center space-x-2 text-gray-500">
//                       <MessageCircle className="h-5 w-5" />
//                       <span>{post.commentCount || 0}</span>
//                     </div>
//                     <div className="flex items-center space-x-2 text-gray-500">
//                       <Eye className="h-5 w-5" />
//                       <span>{post.views || 0}</span>
//                     </div>
//                   </div>

//                   {post.isLocked && (
//                     <div className="text-sm text-gray-500">
//                       🔒 Locked content
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   )
// }

// export default StudentHome

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'
import { Heart, MessageCircle, Eye, Clock, User, Play } from 'lucide-react'
import toast from 'react-hot-toast'

const StudentHome = () => {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveStreams, setLiveStreams] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    fetchFeed()
    fetchLiveStreams()
  }, [])

  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/feed')
      setFeed(res.data.data.posts)
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveStreams = async () => {
    try {
      const res = await api.get('/streams')
      setLiveStreams(res.data.data.streams.filter(s => s.isLive))
    } catch {
      console.error('Failed to load live streams')
    }
  }

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`)
      setFeed(feed.map(post =>
        post._id === postId
          ? {
              ...post,
              likes: post.likes.includes(user._id)
                ? post.likes.filter(id => id !== user._id)
                : [...post.likes, user._id]
            }
          : post
      ))
    } catch {
      toast.error('Failed to like post')
    }
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-text-secondary">
          Discover new content from creators you follow
        </p>
      </div>

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2 text-error animate-pulse">LIVE</span>
            Live Now
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.slice(0, 3).map(stream => (
              <Link
                key={stream._id}
                to={`/live/${stream._id}`}
                className="border rounded-lg overflow-hidden hover:border-accent transition"
              >
                <div className="relative aspect-video bg-bg-tertiary flex items-center justify-center">
                  <Play className="h-12 w-12 text-text-muted group-hover:text-accent" />
                  <span className="absolute top-2 left-2 bg-error text-white px-2 py-1 text-xs rounded">
                    LIVE
                  </span>
                  <span className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
                    {stream.viewerCount || 0} watching
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold truncate">{stream.title}</h3>
                  <p className="text-sm text-text-muted">
                    {stream.creator.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {feed.length === 0 ? (
          <div className="text-center py-16">
            <User className="h-16 w-16 mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-medium mb-2">No posts yet</h3>
            <p className="text-text-secondary mb-6">
              Follow some creators to see their content here
            </p>
            <Link
              to="/explore"
              className="bg-accent text-white px-6 py-2 rounded-full"
            >
              Explore Creators
            </Link>
          </div>
        ) : (
          feed.map(post => (
            <div
              key={post._id}
              className="border rounded-lg overflow-hidden bg-bg-card"
            >
              {/* Post Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <img
                  src={post.author.avatar || '/default-avatar.png'}
                  alt={post.author.username}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <Link
                    to={`/creator/${post.author.username}`}
                    className="font-semibold hover:text-accent"
                  >
                    {post.author.username}
                  </Link>
                  <div className="flex items-center text-sm text-text-muted">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(post.publishedAt)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {post.title && (
                  <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                )}

                <p className="mb-4 whitespace-pre-wrap">
                  {post.content.length > 300
                    ? `${post.content.slice(0, 300)}...`
                    : post.content}
                </p>

                {post.media?.map((m, i) => (
                  <div key={i} className="mb-3">
                    {m.type === 'image' ? (
                      <img src={m.url} className="rounded-lg max-h-96 mx-auto" />
                    ) : (
                      <video src={m.url} controls className="rounded-lg w-full" />
                    )}
                  </div>
                ))}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-2 ${
                      post.likes.includes(user._id)
                        ? 'text-error'
                        : 'text-text-muted'
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        post.likes.includes(user._id) ? 'fill-current' : ''
                      }`}
                    />
                    {post.likes.length}
                  </button>

                  <div className="flex items-center gap-2 text-text-muted">
                    <MessageCircle className="h-5 w-5" />
                    {post.commentCount || 0}
                  </div>

                  <div className="flex items-center gap-2 text-text-muted">
                    <Eye className="h-5 w-5" />
                    {post.views || 0}
                  </div>

                  {post.isLocked && (
                    <span className="text-sm text-text-muted">🔒 Locked</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StudentHome
