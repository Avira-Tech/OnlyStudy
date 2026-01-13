const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlystudy';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const User = require('../models/User');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const LiveStream = require('../models/LiveStream');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');

// Sample data
const creatorData = [
  {
    username: 'techguru',
    email: 'techguru@example.com',
    password: 'password123',
    role: 'creator',
    bio: 'Full-stack developer teaching web development. React, Node.js, and more!',
    isCreatorVerified: true,
    creatorApplication: {
      bio: 'I am a passionate developer with 10+ years of experience.',
      category: 'programming',
      experience: 'Senior Developer at Tech Corp',
      status: 'approved',
    },
  },
  {
    username: 'designmaster',
    email: 'designmaster@example.com',
    password: 'password123',
    role: 'creator',
    bio: 'UI/UX Designer sharing design tips and tutorials. Learn Figma, Photoshop, and more!',
    isCreatorVerified: true,
    creatorApplication: {
      bio: 'Professional designer with 8 years experience.',
      category: 'design',
      experience: 'Lead Designer at Design Agency',
      status: 'approved',
    },
  },
  {
    username: 'businessexpert',
    email: 'businessexpert@example.com',
    password: 'password123',
    role: 'creator',
    bio: 'Business strategist helping entrepreneurs build successful businesses.',
    isCreatorVerified: true,
    creatorApplication: {
      bio: 'MBA from top business school, 15 years entrepreneurial experience.',
      category: 'business',
      experience: 'Founder of 3 successful startups',
      status: 'approved',
    },
  },
  {
    username: 'musicmaker',
    email: 'musicmaker@example.com',
    password: 'password123',
    role: 'creator',
    bio: 'Music producer sharing beats, tutorials, and production secrets.',
    isCreatorVerified: true,
    creatorApplication: {
      bio: 'Professional music producer with 12 years experience.',
      category: 'music',
      experience: 'Produced for major labels',
      status: 'approved',
    },
  },
  {
    username: 'fitnesscoach',
    email: 'fitnesscoach@example.com',
    password: 'password123',
    role: 'creator',
    bio: 'Certified fitness trainer helping you achieve your health goals.',
    isCreatorVerified: true,
    creatorApplication: {
      bio: 'NASM certified personal trainer with 5 years experience.',
      category: 'fitness',
      experience: 'Trainer at Premium Gym',
      status: 'approved',
    },
  },
];

const studentData = [
  {
    username: 'student1',
    email: 'student1@example.com',
    password: 'password123',
    role: 'student',
    bio: 'Learning to code',
  },
  {
    username: 'student2',
    email: 'student2@example.com',
    password: 'password123',
    role: 'student',
    bio: 'Design enthusiast',
  },
  {
    username: 'student3',
    email: 'student3@example.com',
    password: 'password123',
    role: 'student',
    bio: 'Aspiring entrepreneur',
  },
];

const samplePosts = [
  {
    title: 'Getting Started with React Hooks',
    content: `React Hooks have revolutionized how we write React components. In this post, I'll cover the most important hooks you need to know.

## useState
The most basic hook for managing state in functional components.

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

## useEffect
Used for side effects like data fetching, subscriptions, etc.

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## useContext
Access context values without prop drilling.

Start using hooks in your projects today!`,
    contentType: 'text',
    isFree: true,
    price: 0,
    tags: ['react', 'javascript', 'hooks'],
  },
  {
    title: 'Node.js REST API Tutorial',
    content: `Building a REST API with Node.js and Express is easier than you think. Let me walk you through the entire process.

## Setting Up
First, initialize your project:
\`\`\`bash
npm init -y
npm install express mongoose dotenv
\`\`\`

## Creating Routes
Define your API endpoints with Express router.

## Database Integration
Connect to MongoDB using Mongoose ODM.

This is a premium tutorial with full source code included!`,
    contentType: 'text',
    isFree: false,
    price: 9.99,
    tags: ['nodejs', 'express', 'api', 'mongodb'],
  },
  {
    title: 'UI Design Principles Every Developer Should Know',
    content: `Great UI design makes your applications stand out. Here are the key principles:

## 1. Consistency
Keep your design consistent across all pages.

## 2. Visual Hierarchy
Guide users' attention with size, color, and placement.

## 3. Feedback
Let users know what happened after their actions.

## 4. Accessibility
Make your app usable for everyone.

Premium members get access to Figma files and more detailed breakdowns!`,
    contentType: 'text',
    isFree: true,
    price: 0,
    tags: ['design', 'ui', 'ux'],
  },
  {
    title: 'Advanced CSS Techniques',
    content: `Take your CSS skills to the next level with these advanced techniques.

## CSS Grid
Master two-dimensional layouts.

## Flexbox
Perfect for one-dimensional layouts.

## CSS Custom Properties
Variables for maintainable stylesheets.

## Animations
Smooth transitions and animations.

Watch the full video tutorial for step-by-step guidance!`,
    contentType: 'video',
    isFree: false,
    price: 14.99,
    tags: ['css', 'web design', 'frontend'],
  },
  {
    title: 'Business Strategy for Startups',
    content: `Building a successful startup requires more than just a great idea. Let me share my insights.

## Market Research
Understand your target audience before building.

## MVP Development
Build fast, learn faster.

## Growth Hacking
Strategies that actually work for startups.

Join my premium community for weekly deep-dives!`,
    contentType: 'text',
    isFree: false,
    price: 19.99,
    tags: ['business', 'startup', 'entrepreneurship'],
  },
];

// Seed function
const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Subscription.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await LiveStream.deleteMany({});
    await Notification.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Cleared existing data');

    // Create creators
    const creators = await User.insertMany(creatorData);
    console.log(`Created ${creators.length} creators`);

    // Create students
    const students = await User.insertMany(studentData);
    console.log(`Created ${students.length} students`);

    // Create posts for each creator
    const allPosts = [];
    for (let i = 0; i < creators.length; i++) {
      const creator = creators[i];
      // Add 2-3 posts per creator
      const postsPerCreator = 2 + Math.floor(Math.random() * 2);
      
      for (let j = 0; j < postsPerCreator; j++) {
        const samplePost = samplePosts[(i + j) % samplePosts.length];
        allPosts.push({
          ...samplePost,
          author: creator._id,
          title: `${samplePost.title} - Part ${j + 1}`,
        });
      }
    }

    const posts = await Post.insertMany(allPosts);
    console.log(`Created ${posts.length} posts`);

    // Create subscriptions
    const subscriptions = [];
    for (const student of students) {
      // Each student subscribes to 2-3 creators
      const subscribedCreators = creators
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 2));

      for (const creator of subscribedCreators) {
        subscriptions.push({
          subscriber: student._id,
          creator: creator._id,
          tier: ['basic', 'premium', 'vip'][Math.floor(Math.random() * 3)],
          price: [4.99, 9.99, 19.99][Math.floor(Math.random() * 3)],
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true,
        });
      }
    }

    const subs = await Subscription.insertMany(subscriptions);
    console.log(`Created ${subs.length} subscriptions`);

    // Create some transactions
    const transactions = [];
    for (const subscription of subs) {
      transactions.push({
        user: subscription.subscriber,
        type: 'subscription',
        amount: subscription.price,
        status: 'completed',
        relatedUser: subscription.creator,
        relatedSubscription: subscription._id,
        platformFee: subscription.price * 0.20,
        creatorEarnings: subscription.price * 0.80,
        description: `Monthly subscription to creator`,
      });
    }

    await Transaction.insertMany(transactions);
    console.log('Created transactions');

    // Create some conversations
    const conversations = [];
    for (let i = 0; i < Math.min(students.length, 3); i++) {
      conversations.push({
        participants: [students[i]._id, creators[i]._id],
        lastMessageAt: new Date(),
      });
    }

    const convos = await Conversation.insertMany(conversations);
    console.log(`Created ${convos.length} conversations`);

    // Add some messages
    const messages = [];
    for (const convo of convos) {
      messages.push({
        conversation: convo._id,
        sender: convo.participants[0],
        content: 'Hey! I really enjoy your content!',
        messageType: 'text',
      });
      messages.push({
        conversation: convo._id,
        sender: convo.participants[1],
        content: 'Thank you! Glad you like it! Let me know if you have any questions.',
        messageType: 'text',
      });
    }

    await Message.insertMany(messages);
    console.log('Created messages');

    // Create a few notifications
    const notifications = [];
    for (let i = 0; i < Math.min(students.length, 3); i++) {
      notifications.push({
        recipient: creators[i]._id,
        sender: students[i]._id,
        type: 'new_subscriber',
        title: 'New Subscriber',
        message: `${students[i].username} subscribed to your content!`,
        data: { subscriptionId: subs[i]?._id },
      });
    }

    await Notification.insertMany(notifications);
    console.log('Created notifications');

    // Create some live streams
    const streams = [];
    for (let i = 0; i < 2; i++) {
      streams.push({
        streamer: creators[i]._id,
        title: `Live Q&A Session - Ask Me Anything!`,
        description: 'Join me for a live Q&A session. Ask me anything about development!',
        status: 'live',
        accessType: 'free',
        startedAt: new Date(),
        peakViewers: 10 + Math.floor(Math.random() * 20),
        totalViewers: 50 + Math.floor(Math.random() * 100),
        duration: 0,
        chatEnabled: true,
      });
    }

    const liveStreams = await LiveStream.insertMany(streams);
    console.log(`Created ${liveStreams.length} live streams`);

    console.log('\n✅ Seeding completed successfully!\n');

    // Print login credentials
    console.log('=== Login Credentials ===\n');
    console.log('CREATORS:');
    creatorData.forEach((c) => {
      console.log(`  ${c.username}@example.com / ${c.password}`);
    });
    console.log('\nSTUDENTS:');
    studentData.forEach((s) => {
      console.log(`  ${s.username}@example.com / ${s.password}`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run seed
seed();

