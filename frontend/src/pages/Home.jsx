// import { Link } from 'react-router-dom'
// import useAuthStore from '../store/authStore'
// import { Play, Users, BookOpen, TrendingUp, Star, ArrowRight } from 'lucide-react'

// const Home = () => {
//   const { isAuthenticated, user } = useAuthStore()

//   const features = [
//     {
//       icon: BookOpen,
//       title: 'Expert-Led Courses',
//       description: 'Learn from verified educators with real-world experience in their fields.',
//     },
//     {
//       icon: Users,
//       title: 'Community Learning',
//       description: 'Connect with fellow students and build your network in the education space.',
//     },
//     {
//       icon: Play,
//       title: 'Live Streaming',
//       description: 'Join interactive live sessions and get your questions answered in real-time.',
//     },
//     {
//       icon: TrendingUp,
//       title: 'Track Progress',
//       description: 'Monitor your learning journey with detailed analytics and achievements.',
//     },
//   ]

//   const testimonials = [
//     {
//       name: 'Sarah Johnson',
//       role: 'Data Science Student',
//       content: 'OnlyStudy helped me master Python and machine learning. The live sessions are incredible!',
//       rating: 5,
//     },
//     {
//       name: 'Mike Chen',
//       role: 'Web Developer',
//       content: 'The creator community here is amazing. I learned React from scratch and got my first job.',
//       rating: 5,
//     },
//     {
//       name: 'Dr. Emily Rodriguez',
//       role: 'Educator',
//       content: 'As a professor, I love how OnlyStudy lets me reach students globally with interactive content.',
//       rating: 5,
//     },
//   ]

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       {/* Navigation */}
//       <nav className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center">
//               <Link to="/" className="text-2xl font-bold text-blue-600">
//                 OnlyStudy
//               </Link>
//             </div>
//             <div className="flex items-center space-x-4">
//               <Link
//                 to="/explore"
//                 className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Explore
//               </Link>
//               {isAuthenticated ? (
//                 <Link
//                   to={user?.role === 'creator' ? '/creator/dashboard' : '/home'}
//                   className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
//                 >
//                   Dashboard
//                 </Link>
//               ) : (
//                 <>
//                   <Link
//                     to="/login"
//                     className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
//                   >
//                     Login
//                   </Link>
//                   <Link
//                     to="/register"
//                     className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
//                   >
//                     Get Started
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative py-20 sm:py-24 lg:py-32">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center">
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
//               Learn from the{' '}
//               <span className="text-blue-600">Best Educators</span>
//             </h1>
//             <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
//               Join a community of learners and creators. Access exclusive content,
//               live streams, and personalized learning experiences from verified experts.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Link
//                 to="/explore"
//                 className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
//               >
//                 Start Learning
//               </Link>
//               <Link
//                 to="/register"
//                 className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
//               >
//                 Become a Creator
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-16 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Why Choose OnlyStudy?
//             </h2>
//             <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//               Experience learning like never before with our innovative platform features.
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="text-center">
//                 <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <feature.icon className="h-8 w-8 text-blue-600" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                   {feature.title}
//                 </h3>
//                 <p className="text-gray-600">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials Section */}
//       <section className="py-16 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               What Our Community Says
//             </h2>
//             <p className="text-lg text-gray-600">
//               Join thousands of satisfied learners and creators.
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {testimonials.map((testimonial, index) => (
//               <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
//                 <div className="flex mb-4">
//                   {[...Array(testimonial.rating)].map((_, i) => (
//                     <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
//                   ))}
//                 </div>
//                 <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
//                 <div>
//                   <p className="font-semibold text-gray-900">{testimonial.name}</p>
//                   <p className="text-sm text-gray-500">{testimonial.role}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-16 bg-blue-600">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-3xl font-bold text-white mb-4">
//             Ready to Start Your Learning Journey?
//           </h2>
//           <p className="text-xl text-blue-100 mb-8">
//             Join our community today and unlock your potential.
//           </p>
//           <Link
//             to="/register"
//             className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
//           >
//             Get Started Now
//             <ArrowRight className="ml-2 h-5 w-5" />
//           </Link>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <h3 className="text-2xl font-bold text-blue-400 mb-4">OnlyStudy</h3>
//               <p className="text-gray-400">
//                 Empowering learners worldwide with expert-led education.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4">Platform</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link to="/explore" className="hover:text-white">Explore</Link></li>
//                 <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
//                 <li><Link to="/creators" className="hover:text-white">For Creators</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4">Support</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
//                 <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
//                 <li><Link to="/community" className="hover:text-white">Community</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4">Legal</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
//                 <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
//             <p>&copy; 2024 OnlyStudy. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

// export default Home

import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
  Heart,
  Users,
  Star,
  Play,
  Crown,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    {
      icon: Heart,
      title: 'Exclusive Content',
      description: 'Get access to premium photos, videos, and live streams from your favorite creators.'
    },
    {
      icon: Users,
      title: 'Direct Support',
      description: 'Show appreciation with tips, messages, and build personal connections with creators.'
    },
    {
      icon: Play,
      title: 'Live Interactions',
      description: 'Join live streams, participate in Q&A sessions, and engage in real-time conversations.'
    },
    {
      icon: Crown,
      title: 'Creator Economy',
      description: 'Monetize your content and build a sustainable income from your passionate fans.'
    }
  ]

  const testimonials = [
    {
      name: 'Alex Rivera',
      role: 'Content Creator',
      content: 'OnlyFans has transformed my career. I can now focus on creating content I love while earning a living.',
      rating: 5
    },
    {
      name: 'Jordan Blake',
      role: 'Fan & Supporter',
      content: 'The best platform for supporting creators directly. The exclusive content and personal connections are amazing.',
      rating: 5
    },
    {
      name: 'Taylor Swift',
      role: 'Artist & Creator',
      content: 'Finally, a platform that puts creators first. The community here is incredibly supportive and engaged.',
      rating: 5
    }
  ]

  const featuredCreators = [
    {
      username: 'sarahfitness',
      avatar: '/api/placeholder/100/100',
      banner: '/api/placeholder/300/150',
      subscriberCount: '125K',
      isVerified: true,
      category: 'Fitness'
    },
    {
      username: 'mikephoto',
      avatar: '/api/placeholder/100/100',
      banner: '/api/placeholder/300/150',
      subscriberCount: '89K',
      isVerified: true,
      category: 'Photography'
    },
    {
      username: 'emilyart',
      avatar: '/api/placeholder/100/100',
      banner: '/api/placeholder/300/150',
      subscriberCount: '67K',
      isVerified: false,
      category: 'Art'
    }
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ---------- NAV ---------- */}
      <nav className="bg-bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-3xl font-bold text-accent">
              OnlyFans
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                to="/explore"
                className="text-text-secondary hover:text-text-primary px-3 py-2 text-sm"
              >
                Explore
              </Link>

              {isAuthenticated ? (
                <Link
                  to={user?.role === 'creator' ? '/creator/dashboard' : '/home'}
                  className="bg-accent text-white px-4 py-2 rounded-md text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-text-secondary px-3 py-2 text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-accent text-white px-4 py-2 rounded-md text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Your <span className="text-accent">Fans</span> Await
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            Join the world's largest creator community. Share exclusive content,
            connect with fans, and monetize your passion.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore" className="bg-accent text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-accent-hover transition">
              Discover Creators
            </Link>
            <Link
              to="/register"
              className="border border-border text-text-primary px-8 py-3 rounded-lg text-lg font-medium hover:bg-bg-hover transition"
            >
              Start Creating
            </Link>
          </div>
          <div className="mt-8 text-text-muted">
            <p>Join millions of creators and fans worldwide</p>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED CREATORS ---------- */}
      <section className="py-16 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Creators</h2>
            <p className="text-text-secondary">Discover amazing content from top creators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCreators.map((creator, i) => (
              <Link
                key={i}
                to={`/creator/${creator.username}`}
                className="bg-bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition"
              >
                <div
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${creator.banner})` }}
                />
                <div className="p-4 text-center">
                  <img
                    src={creator.avatar}
                    alt={creator.username}
                    className="w-16 h-16 rounded-full mx-auto -mt-8 border-4 border-bg-card mb-4"
                  />
                  <h3 className="font-semibold flex items-center justify-center gap-1">
                    {creator.username}
                    {creator.isVerified && <Star className="h-4 w-4 text-accent fill-current" />}
                  </h3>
                  <p className="text-sm text-text-muted mb-2">{creator.category}</p>
                  <p className="text-accent font-medium">{creator.subscriberCount} subscribers</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose OnlyFans?</h2>
            <p className="text-text-secondary">The platform built for creators and fans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="py-16 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">50M+</div>
              <div className="text-text-secondary">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">$1B+</div>
              <div className="text-text-secondary">Paid to Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">2M+</div>
              <div className="text-text-secondary">Content Creators</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-text-secondary">Real stories from creators and fans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-bg-card p-6 rounded-lg border">
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-accent fill-current" />
                  ))}
                </div>
                <p className="mb-4">"{t.content}"</p>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-text-muted">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-16 bg-accent text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Join the Creator Economy?
          </h2>
          <p className="text-accent/80 text-xl mb-8">
            Start your journey today and connect with fans who appreciate your content.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center bg-white text-accent px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center border border-white/20 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white/10 transition"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Explore Creators
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-bg-tertiary py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-accent mb-4">OnlyFans</h3>
              <p className="text-text-muted">
                The world's largest creator community platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Creators</h4>
              <ul className="space-y-2 text-text-muted">
                <li><Link to="/creator/start" className="hover:text-accent">Start Creating</Link></li>
                <li><Link to="/creator/tools" className="hover:text-accent">Creator Tools</Link></li>
                <li><Link to="/creator/success" className="hover:text-accent">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fans</h4>
              <ul className="space-y-2 text-text-muted">
                <li><Link to="/explore" className="hover:text-accent">Find Creators</Link></li>
                <li><Link to="/pricing" className="hover:text-accent">Pricing</Link></li>
                <li><Link to="/support" className="hover:text-accent">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-text-muted">
                <li><Link to="/about" className="hover:text-accent">About</Link></li>
                <li><Link to="/blog" className="hover:text-accent">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-accent">Careers</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-text-muted">
            <p>&copy; 2024 OnlyFans. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
