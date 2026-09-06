import { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  // Initial Sync from LocalStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        // Clean/Normalize Role to avoid case-sensitivity issues
        if (parsedUser && parsedUser.role) {
          parsedUser.role = parsedUser.role.toLowerCase().trim();
        }
        setUser(parsedUser);
        setToken(savedToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false); // Session resolution finished
    }
  }, []);

  const login = (userData, userToken) => {
    // Clean user object before storing
    const cleanedUser = {
      ...userData,
      role: userData?.role ? userData.role.toLowerCase().trim() : 'customer'
    };

    setUser(cleanedUser);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(cleanedUser));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;