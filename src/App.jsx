import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { API_URL } from './config';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vacantes from './pages/Vacantes';
import Colaboracion from './pages/Colaboracion';
import CVs from './pages/CVs';
import Tareas from './pages/Tareas';
import Instituciones from './pages/Instituciones';
import Directorio from './pages/Directorio';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/vacantes" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
          <Route path="/vacantes" element={<ProtectedRoute><Vacantes /></ProtectedRoute>} />
          <Route path="/colaboracion" element={<ProtectedRoute><Colaboracion /></ProtectedRoute>} />
          <Route path="/cvs" element={<ProtectedRoute><CVs /></ProtectedRoute>} />
          <Route path="/tareas" element={<ProtectedRoute><Tareas /></ProtectedRoute>} />
          <Route path="/instituciones" element={<ProtectedRoute><Instituciones /></ProtectedRoute>} />
          <Route path="/directorio" element={<ProtectedRoute><Directorio /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
