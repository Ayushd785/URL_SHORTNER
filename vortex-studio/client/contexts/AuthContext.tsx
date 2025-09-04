import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authAPI, tokenManager } from "../lib/api";
import { userStorage } from "../lib/storage";

// User interface matching your backend User model
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    analytics: boolean;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication context type
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<User>,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isAuthenticated = !!user && tokenManager.isValid();

  // Clear error helper
  const clearError = () => setError(null);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have a valid token
      if (!tokenManager.isValid()) {
        // Clean up invalid token and user data
        tokenManager.remove();
        userStorage.removeUser();
        setUser(null);
        return;
      }

      // Try to get user from localStorage first (faster)
      const cachedUser = userStorage.getUser();
      if (cachedUser) {
        setUser(cachedUser as User);
      }

      // Then fetch fresh user data from backend
      await refreshUser();
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Clean up on error
      tokenManager.remove();
      userStorage.removeUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data from backend
  const refreshUser = async () => {
    try {
      if (!tokenManager.isValid()) return;

      const response = await authAPI.getCurrentUser();

      if (response.success) {
        setUser(response.data.user);
        userStorage.setUser(response.data.user);
        setError(null);
      }
    } catch (error: any) {
      console.error("Failed to refresh user:", error);

      // If token is invalid, clean up
      if (error.statusCode === 401) {
        tokenManager.remove();
        userStorage.removeUser();
        setUser(null);
      }
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.login(email, password);

      if (response.success) {
        const { user: userData, token } = response.data;

        // Store token and user data
        tokenManager.set(token);
        setUser(userData);
        userStorage.setUser(userData);

        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.register(
        firstName,
        lastName,
        email,
        password,
      );

      if (response.success) {
        const { user: userData, token } = response.data;

        // Store token and user data
        tokenManager.set(token);
        setUser(userData);
        userStorage.setUser(userData);

        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error: any) {
      const errorMessage =
        error.message || "Registration failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);

      // Call backend logout (optional - for session cleanup)
      try {
        await authAPI.logout();
      } catch (error) {
        // Continue with logout even if backend call fails
        console.warn("Backend logout failed:", error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clean up local state
      tokenManager.remove();
      userStorage.removeUser();
      setUser(null);
      setError(null);
      setIsLoading(false);

      // Redirect to home page
      window.location.href = "/";
    }
  };

  // Update profile function
  const updateProfile = async (
    data: Partial<User>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(data);

      if (response.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        userStorage.setUser(updatedUser);
        return { success: true };
      }

      return { success: false, error: "Profile update failed" };
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// Export for convenience
export default AuthContext;
