import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { API_URL } from '../config';
import { Sun, Moon } from 'lucide-react';
import logoAMIB from '../assets/logoamib.jpg';

const Login = () => {
  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  // Password reset states
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas. Intenta de nuevo.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!resetEmail) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setMode('reset');
      } else {
        setError(data.error || 'Ocurrió un error al enviar el código.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!resetCode || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setEmail(resetEmail);
        setPassword('');
        // Clean up reset states
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('login');
          setMessage('');
        }, 3000);
      } else {
        setError(data.error || 'Código incorrecto o expirado.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleEmail) => {
    const success = await login(roleEmail, 'password');
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-slate-600 dark:text-slate-300"
          title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl animate-fade-in shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-1 rounded-full shadow-lg border border-slate-100 h-28 w-28 flex items-center justify-center overflow-hidden">
               <img src={logoAMIB} alt="AMIB Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 mb-2">TalentCollab</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {mode === 'login' && 'Sistema de Colaboración Inter-Institucional'}
            {mode === 'forgot' && 'Recuperación de Contraseña'}
            {mode === 'reset' && 'Restablecer Contraseña'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 text-center border border-red-200 dark:border-red-800/50 animate-shake">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm mb-6 text-center border border-emerald-200 dark:border-emerald-800/50">
            {message}
          </div>
        )}

        {mode === 'login' && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); setResetEmail(email); }} 
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  required
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="text-center mt-4 mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ¿No tienes cuenta? <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Crear cuenta nueva</Link>
              </p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider font-semibold">Selección rápida para probar MVP</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => quickLogin('admin@system.com')} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Admin</span> <span className="text-xs text-slate-500">admin@system.com</span>
                </button>
                <button onClick={() => quickLogin('manager@inst-a.com')} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Management (A)</span> <span className="text-xs text-slate-500">manager@inst-a.com</span>
                </button>
                <button onClick={() => quickLogin('user@inst-a.com')} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl text-sm transition-colors text-slate-700 dark:text-slate-300 flex justify-between items-center border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Universidad (A)</span> <span className="text-xs text-slate-500">user@inst-a.com</span>
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Ingresa el correo electrónico registrado en tu cuenta. Te enviaremos un código de seguridad de 6 dígitos para restablecer tu contraseña.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                required
                disabled={loading}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : 'Enviar Código de Seguridad'}
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-colors"
              disabled={loading}
            >
              Volver al Inicio de Sesión
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Hemos enviado un código a <strong>{resetEmail}</strong>. Ingresa el código de 6 dígitos y tu nueva contraseña.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código de Seguridad (6 dígitos)</label>
              <input 
                type="text" 
                maxLength="6"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white text-center font-mono text-xl tracking-wider"
                required
                disabled={loading}
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                required
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                required
                disabled={loading}
                placeholder="Confirmar contraseña"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : 'Restablecer Contraseña'}
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-colors"
              disabled={loading}
            >
              Cancelar y Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
