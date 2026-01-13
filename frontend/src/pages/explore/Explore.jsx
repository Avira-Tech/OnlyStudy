// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import api from '../../services/api'
// import { Search, Filter, Star, Users, Play, TrendingUp } from 'lucide-react'
// import toast from 'react-hot-toast'

// const Explore = () => {
//   const [creators, setCreators] = useState([])
//   const [categories, setCategories] = useState([])
//   const [trending, setTrending] = useState([])
//   const [liveStreams, setLiveStreams] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedCategory, setSelectedCategory] = useState('all')
//   const { user } = useAuthStore()

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {
//     try {
//       const [creatorsRes, categoriesRes, trendingRes, liveRes] = await Promise.all([
//         api.get('/users/search'),
//         api.get('/users/categories'),
//         api.get('/users/trending'),
//         api.get('/streams'),
//       ])

//       setCreators(creatorsRes.data.data.creators)
//       setCategories(categoriesRes.data.data.categories)
//       setTrending(trendingRes.data.data.creators)
//       setLiveStreams(liveRes.data.data.streams.filter(stream => stream.isLive))
//     } catch (error) {
//       toast.error('Failed to load explore data')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const filteredCreators = creators.filter(creator => {
//     const matchesSearch = creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          creator.bio.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = selectedCategory === 'all' || creator.category === selectedCategory
//     return matchesSearch && matchesCategory
//   })

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Creators</h1>
//         <p className="text-gray-600">Discover amazing educators and start learning today.</p>
//       </div>

//       {/* Search and Filter */}
//       <div className="mb-8 bg-white rounded-lg shadow-md p-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search creators..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <div className="relative">
//             <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
//             <select
//               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//             >
//               <option value="all">All Categories</option>
//               {categories.map(category => (
//                 <option key={category} value={category}>{category}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Live Streams */}
//       {liveStreams.length > 0 && (
//         <div className="mb-8">
//           <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
//             <Play className="h-6 w-6 text-red-500 mr-2" />
//             Live Now
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {liveStreams.map((stream) => (
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
//                   <p className="text-sm text-gray-500 mt-1">{stream.description}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Trending Creators */}
//       <div className="mb-8">
//         <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
//           <TrendingUp className="h-6 w-6 text-blue-500 mr-2" />
//           Trending This Week
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {trending.slice(0, 4).map((creator) => (
//             <Link
//               key={creator._id}
//               to={`/creator/${creator.username}`}
//               className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
//             >
//               <div className="aspect-square bg-gray-200 relative">
//                 <img
//                   src={creator.avatar || '/default-avatar.png'}
//                   alt={creator.username}
//                   className="w-full h-full object-cover"
//                 />
//                 {creator.isCreatorVerified && (
//                   <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
//                     <Star className="h-4 w-4 fill-current" />
//                   </div>
//                 )}
//               </div>
//               <div className="p-4">
//                 <h3 className="font-semibold text-gray-900 mb-1">{creator.username}</h3>
//                 <p className="text-sm text-gray-600 mb-2 line-clamp-2">{creator.bio}</p>
//                 <div className="flex items-center text-sm text-gray-500">
//                   <Users className="h-4 w-4 mr-1" />
//                   {creator.subscriberCount || 0} subscribers
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>

//       {/* All Creators */}
//       <div>
//         <h2 className="text-2xl font-bold text-gray-900 mb-4">All Creators</h2>
//         {filteredCreators.length === 0 ? (
//           <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//             <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-xl font-medium text-gray-900 mb-2">No creators found</h3>
//             <p className="text-gray-600">Try adjusting your search or filters.</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredCreators.map((creator) => (
//               <Link
//                 key={creator._id}
//                 to={`/creator/${creator.username}`}
//                 className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
//               >
//                 <div className="aspect-square bg-gray-200 relative">
//                   <img
//                     src={creator.avatar || '/default-avatar.png'}
//                     alt={creator.username}
//                     className="w-full h-full object-cover"
//                   />
//                   {creator.isCreatorVerified && (
//                     <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
//                       <Star className="h-4 w-4 fill-current" />
//                     </div>
//                   )}
//                 </div>
//                 <div className="p-4">
//                   <h3 className="font-semibold text-gray-900 mb-1">{creator.username}</h3>
//                   <p className="text-sm text-gray-600 mb-2 line-clamp-2">{creator.bio}</p>
//                   <div className="flex items-center justify-between text-sm text-gray-500">
//                     <div className="flex items-center">
//                       <Users className="h-4 w-4 mr-1" />
//                       {creator.subscriberCount || 0}
//                     </div>
//                     <div className="flex items-center">
//                       <Star className="h-4 w-4 mr-1" />
//                       {creator.rating || 0}
//                     </div>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default Explore

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'
import { Search, Star, Heart, Crown, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const Explore = () => {
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [searchParams, setSearchParams] = useSearchParams()

  const { user } = useAuthStore()

  const categories = [
    { id: 'all', label: 'All Creators' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'photography', label: 'Photography' },
    { id: 'art', label: 'Art & Design' },
    { id: 'music', label: 'Music' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'adult', label: 'Adult Content' },
    { id: 'cosplay', label: 'Cosplay' },
    { id: 'dance', label: 'Dance' },
    { id: 'comedy', label: 'Comedy' },
    { id: 'education', label: 'Education' },
  ]

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
    fetchCreators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedCategory, sortBy])

  const fetchCreators = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      // sortBy is passed but backend search endpoint doesn't support it
      // Results are sorted by createdAt (recent) by default

      const res = await api.get(`/users/search?${params.toString()}`)
      setCreators(res.data.data?.creators || [])
    } catch (error) {
      console.error('Failed to load creators:', error)
      toast.error('Failed to load creators')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(searchQuery ? { q: searchQuery } : {})
  }

  const getSubscriptionPrice = (creator) => {
    // Mock subscription prices - in real app this would come from API
    return creator.subscriptionPrice || Math.floor(Math.random() * 20) + 5
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Creators</h1>
        <p className="text-text-secondary text-lg">
          Find your favorite creators and subscribe to exclusive content
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-bg-card rounded-lg border border-border p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-bg-secondary text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg bg-bg-secondary text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg bg-bg-secondary text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Recently Active</option>
              <option value="trending">Trending</option>
              <option value="new">New Creators</option>
            </select>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary border border-border text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold">Trending This Week</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mock trending creators */}
          {[
            { username: 'fitness_girl', avatar: '/api/placeholder/150/150', banner: '/api/placeholder/300/120', subs: '245K', category: 'Fitness', price: 9.99 },
            { username: 'art_master', avatar: '/api/placeholder/150/150', banner: '/api/placeholder/300/120', subs: '189K', category: 'Art', price: 12.99 },
            { username: 'music_star', avatar: '/api/placeholder/150/150', banner: '/api/placeholder/300/120', subs: '156K', category: 'Music', price: 7.99 },
            { username: 'dance_queen', avatar: '/api/placeholder/150/150', banner: '/api/placeholder/300/120', subs: '98K', category: 'Dance', price: 14.99 },
          ].map((creator, i) => (
            <Link
              key={i}
              to={`/creator/${creator.username}`}
              className="bg-bg-card rounded-lg border border-border overflow-hidden hover:border-accent hover:shadow-lg transition-all group"
            >
              <div
                className="h-32 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${creator.banner})` }}
              >
                <div className="absolute top-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded-full font-medium">
                  ${creator.price}/mo
                </div>
              </div>
              <div className="p-4">
                <img
                  src={creator.avatar}
                  alt={creator.username}
                  className="w-16 h-16 rounded-full mx-auto -mt-8 border-4 border-bg-card mb-3"
                />
                <h3 className="font-semibold text-center mb-1 flex items-center justify-center gap-1">
                  {creator.username}
                  <Star className="h-4 w-4 text-accent fill-current" />
                </h3>
                <p className="text-sm text-text-muted text-center mb-2">{creator.category}</p>
                <div className="flex items-center justify-center gap-1 text-sm text-accent font-medium">
                  <Users className="h-4 w-4" />
                  {creator.subs} subscribers
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Creators */}
      <div>
        <h2 className="text-2xl font-bold mb-6">All Creators</h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16 bg-bg-card rounded-lg border border-border">
            <Search className="h-16 w-16 mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-medium mb-2">No creators found</h3>
            <p className="text-text-secondary">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creators.map(creator => (
              <Link
                key={creator._id}
                to={`/creator/${creator.username}`}
                className="bg-bg-card rounded-lg border border-border overflow-hidden hover:border-accent hover:shadow-lg transition-all group"
              >
                {/* Banner */}
                <div
                  className="h-24 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${creator.banner || '/default-banner.png'})` }}
                >
                  <div className="absolute top-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded-full font-medium">
                    ${getSubscriptionPrice(creator)}/mo
                  </div>
                </div>

                {/* Avatar */}
                <div className="px-4 -mt-10">
                  <img
                    src={creator.avatar || '/default-avatar.png'}
                    alt={creator.username}
                    className="w-20 h-20 rounded-full border-4 border-bg-card mx-auto"
                  />
                </div>

                {/* Info */}
                <div className="p-4 text-center">
                  <h3 className="font-semibold mb-1 flex items-center justify-center gap-1">
                    {creator.username}
                    {creator.isCreatorVerified && <Star className="h-4 w-4 text-accent fill-current" />}
                  </h3>

                  {creator.bio && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                      {creator.bio}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-sm text-text-muted mb-3">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-accent" />
                      {creator.rating?.toFixed(1) || 'New'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {creator.subscriberCount || 0}
                    </span>
                  </div>

                  {creator.category && (
                    <div className="mb-3">
                      <span className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary">
                        {creator.category}
                      </span>
                    </div>
                  )}

                  <button className="w-full bg-accent text-white py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors group-hover:bg-accent-hover">
                    Subscribe
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Explore
