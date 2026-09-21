import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiRequest } from "../lib/api";

// any component can access the authentication state directly

const normalizeUser = (raw: any): User => ({
  id: raw.id ?? raw._id,
  name: raw.name,
  email: raw.email,
  avatar: raw.avatar,
});

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rehydrate = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest("/auth/me");
        setUser(normalizeUser(data.user));
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    rehydrate();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    console.log("login raw response:", data.user);
    localStorage.setItem("token", data.token);
    setUser(normalizeUser(data.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    localStorage.setItem("token", data.token);
    setUser(normalizeUser(data.user));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
