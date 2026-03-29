import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, getCurrentUser } from "../api/auth";
import type { User } from "../../types/types";


interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
const [isLoading, setIsLoading] = useState(false);
const [isInitializing, setIsInitializing] = useState(true);

useEffect(() => {
  const initializeAuth = async () => {
    if (token) {
      try {
        await refreshUser();
      } catch {
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);
      }
    }
    setIsInitializing(false);
  };

  initializeAuth();
}, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ username, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("authToken", response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRegister({ username, email, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("authToken", response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await getCurrentUser(token);
    setUser(response.user);
  };

  return (
<AuthContext.Provider
  value={{
    user,
    token,
    isLoading,
    isInitializing,
    login,
    register,
    logout,
    refreshUser
  }}
>      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
