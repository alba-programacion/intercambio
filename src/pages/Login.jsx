import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas. Intenta de nuevo.');
    }
  };

  const quickLogin = async (roleEmail) => {
    const success = await login(roleEmail, 'password');
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl animate-fade-in shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 mb-2">TalentCollab</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Sistema de Colaboración Inter-Institucional</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30">
            Iniciar Sesión
          </button>
        </form>

        <div className="text-center mt-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ¿No tienes cuenta? <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Crear cuenta nueva</Link>
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider font-semibold">Selección rápida para probar MVP</p>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => quickLogin('admin@system.com')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200 dark:border-slate-700/50">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Admin</span> <span className="text-xs">admin@system.com</span>
            </button>
            <button onClick={() => quickLogin('manager@inst-a.com')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200 dark:border-slate-700/50">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Management (A)</span> <span className="text-xs">manager@inst-a.com</span>
            </button>
            <button onClick={() => quickLogin('user@inst-a.com')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200 dark:border-slate-700/50">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Usuario (A)</span> <span className="text-xs">user@inst-a.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
