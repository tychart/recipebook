/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
} from "../api/auth";
import type { User } from "../../types/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const response = await getCurrentUser(token);
    setUser(response.user);
  }, [token]);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (token) {
        try {
          await refreshUser();
        } catch {
          localStorage.removeItem("authToken");
          if (active) {
            setToken(null);
            setUser(null);
          }
        }
      }

      if (active) {
        setIsInitializing(false);
      }
    };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, [refreshUser, token]);

  const login = async (username: string, password: string) => {
    const response = await apiLogin({ username, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("authToken", response.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiRegister({ username, email, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem("authToken", response.token);
  };

  const logout = async () => {
    const stored = token ?? localStorage.getItem("authToken");
    if (stored) {
      try {
        await apiLogout(stored);
      } catch {
        // Still clear client session if the server is unreachable or token already invalid.
      }
    }
    localStorage.removeItem("authToken");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitializing,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
