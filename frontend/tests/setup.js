/**
 * Frontend Test Setup
 * 
 * Configures the testing environment for React components,
 * including mock providers, custom matchers, and test utilities.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ children }) => <div data-testid="route">{children}</div>,
    Link: ({ children, to, ...props }) => (
      <a href={to} data-testid="link" {...props}>{children}</a>
    ),
    NavLink: ({ children, to, ...props }) => (
      <a href={to} data-testid="nav-link" {...props}>{children}</a>
    ),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '' }),
    useParams: () => ({}),
  };
});

// Mock API service
vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock Zustand store
vi.mock('../src/store/authStore', () => ({
  default: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock Socket.IO client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    // Add common icon mocks
    Home: () => <svg data-testid="icon-home" />,
    User: () => <svg data-testid="icon-user" />,
    Settings: () => <svg data-testid="icon-settings" />,
    LogOut: () => <svg data-testid="icon-logout" />,
    Menu: () => <svg data-testid="icon-menu" />,
    X: () => <svg data-testid="icon-x" />,
    Bell: () => <svg data-testid="icon-bell" />,
    MessageCircle: () => <svg data-testid="icon-message" />,
  };
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  toHaveTextContent(received, text) {
    const pass = received?.textContent?.includes(text) || false;
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have text content "${text}"`,
    };
  },
});

// Helper to render with providers
export const renderWithProviders = (component, { 
  authStore = null, 
  router = true 
} = {}) => {
  // Default implementation - can be extended with actual providers
  return {
    component,
    rerender: vi.fn(),
    unmount: vi.fn(),
    container: document.createElement('div'),
    baseElement: document.createElement('div'),
  };
};

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'student',
  avatar: '/uploads/avatars/default.png',
  bio: 'Test bio',
  isVerified: true,
  isCreatorVerified: false,
  ...overrides,
});

// Helper to create mock post
export const createMockPost = (overrides = {}) => ({
  _id: 'post_123',
  title: 'Test Post',
  content: 'This is test content',
  author: createMockUser(),
  contentType: 'text',
  isFree: true,
  price: 0,
  status: 'published',
  likeCount: 0,
  commentCount: 0,
  views: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock subscription
export const createMockSubscription = (overrides = {}) => ({
  _id: 'sub_123',
  subscriber: createMockUser(),
  creator: createMockUser({ role: 'creator' }),
  tier: 'basic',
  price: 4.99,
  status: 'active',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

// Helper to create mock message
export const createMockMessage = (overrides = {}) => ({
  _id: 'msg_123',
  conversation: 'conv_123',
  sender: createMockUser(),
  content: 'Test message',
  messageType: 'text',
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock live stream
export const createMockLiveStream = (overrides = {}) => ({
  _id: 'stream_123',
  title: 'Test Stream',
  description: 'Test description',
  streamer: createMockUser({ role: 'creator' }),
  status: 'live',
  accessType: 'subscribers',
  price: 0,
  totalViewers: 10,
  peakViewers: 25,
  totalTips: 50,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

// Silence console during tests (optional)
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.info.mockRestore();
});

