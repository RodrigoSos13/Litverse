import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", withCredentials: true });
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config.url.startsWith("/auth/")) window.dispatchEvent(new Event("litverse:session-expired"));
  return Promise.reject(error);
});
export default api;
