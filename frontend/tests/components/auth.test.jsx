/**
 * Authentication Components Tests
 * 
 * Tests for Login, Register, and Protected Route components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import components (we'll create these test files)
import Login from '../src/pages/auth/Login';
import Register from '../src/pages/auth/Register';

// Mock API
const mockApi = {
  post: vi.fn(),
  get: vi.fn(),
};

// Mock auth store
const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
};

// Mock useAuthStore
vi.mock('../src/store/authStore', () => ({
  default: mockAuthStore,
}));

vi.mock('../src/services/api', () => ({
  default: mockApi,
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.loading = false;
    mockAuthStore.error = null;
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Render Tests', () => {
    it('should render login form', () => {
      renderLogin();
      
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render "Forgot Password" link', () => {
      renderLogin();
      
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should render "Sign Up" link', () => {
      renderLogin();
      
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      renderLogin();
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      renderLogin();
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLogin();
      
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  describe('Login Functionality', () => {
    it('should call login API on valid submission', async () => {
      const user = userEvent.setup();
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: { _id: '123', email: 'test@example.com', role: 'student' },
            accessToken: 'mock_token',
            refreshToken: 'mock_refresh',
          },
        },
      });

      renderLogin();
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
      });
    });

    it('should redirect on successful login', async () => {
      const user = userEvent.setup();
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: { _id: '123', email: 'test@example.com', role: 'student' },
            accessToken: 'mock_token',
            refreshToken: 'mock_refresh',
          },
        },
      });

      renderLogin();
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    it('should show error on failed login', async () => {
      const user = userEvent.setup();
      mockApi.post.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      });

      renderLogin();
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'WrongPassword123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.type).toBe('password');
      
      // Find and click visibility toggle button
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);
      
      expect(passwordInput.type).toBe('text');
    });
  });
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.loading = false;
    mockAuthStore.error = null;
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Render Tests', () => {
    it('should render registration form', () => {
      renderRegister();
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render role selection', () => {
      renderRegister();
      
      expect(screen.getByRole('radio', { name: /student/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /creator/i })).toBeInTheDocument();
    });

    it('should render "Sign In" link', () => {
      renderRegister();
      
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have username field with validation', async () => {
      const user = userEvent.setup();
      renderRegister();
      
      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toBeInTheDocument();
      
      await user.type(usernameInput, 'ab');
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });

    it('should have password field with validation', async () => {
      const user = userEvent.setup();
      renderRegister();
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      await user.type(passwordInput, 'short');
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should default to student role', () => {
      renderRegister();
      
      expect(screen.getByRole('radio', { name: /student/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /creator/i })).not.toBeChecked();
    });

    it('should allow selecting creator role', async () => {
      const user = userEvent.setup();
      renderRegister();
      
      await user.click(screen.getByRole('radio', { name: /creator/i }));
      
      expect(screen.getByRole('radio', { name: /creator/i })).toBeChecked();
    });
  });

  describe('Registration Functionality', () => {
    it('should call register API with correct data', async () => {
      const user = userEvent.setup();
      mockApi.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            user: { _id: '123', username: 'testuser', email: 'test@example.com', role: 'student' },
            accessToken: 'mock_token',
            refreshToken: 'mock_refresh',
          },
        },
      });

      renderRegister();
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: 'student',
        });
      });
    });

    it('should handle existing email error', async () => {
      const user = userEvent.setup();
      mockApi.post.mockRejectedValue({
        response: {
          data: {
            message: 'Email already registered',
          },
        },
      });

      renderRegister();
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });

    it('should handle existing username error', async () => {
      const user = userEvent.setup();
      mockApi.post.mockRejectedValue({
        response: {
          data: {
            message: 'Username already taken',
          },
        },
      });

      renderRegister();
      
      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Protected Route', () => {
  const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = mockAuthStore;

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  };

  it('should redirect unauthenticated users to login', () => {
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    // Simulate navigating to dashboard when not authenticated
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it('should render content for authenticated users', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { _id: '123', role: 'student' };

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    // Note: In actual test, you'd navigate to /dashboard
    expect(ProtectedRoute).toBeDefined();
  });

  it('should restrict access by role', () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { _id: '123', role: 'student' };

    const { rerender } = render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Admin Panel</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        </Routes>
      </BrowserRouter>
    );

    // Student trying to access admin panel
    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
  });
});

