import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function restore() {
    setLoading(true);
    setError("");
    try { const response = await api.get("/auth/me"); setUser(response.data); }
    catch (err) { if (err.response?.status !== 401) setError("Não foi possível conectar ao LitVerse. Verifique sua conexão e tente novamente."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    localStorage.removeItem("litverse:user");
    restore();
    const expired = () => setUser(null);
    window.addEventListener("litverse:session-expired", expired);
    return () => window.removeEventListener("litverse:session-expired", expired);
  }, []);
  async function authenticate(mode, values) {
    const response = await api.post(`/auth/${mode}`, values);
    setUser(response.data);
  }
  async function logout() { await api.post("/auth/logout"); setUser(null); }
  return <AuthContext.Provider value={{ user, loading, error, restore, authenticate, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
