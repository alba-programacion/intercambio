import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const [newInstName, setNewInstName] = useState('');
  const [newInstProfile, setNewInstProfile] = useState('');
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    fetch('https://paleturquoise-stork-428174.hostingersite.com/api/institutions')
      .then(res => res.json())
      .then(data => setInstitutions(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!institutionId && !newInstName) {
        setLoading(false);
        return setError('Selecciona una institución existente o ingresa el nombre de una nueva.');
      }
      
      const payload = {
        name, email, password, role,
        institutionId: institutionId === 'NEW' ? '' : institutionId,
        newInstitutionName: institutionId === 'NEW' ? newInstName : '',
        newInstitutionProfile: institutionId === 'NEW' ? newInstProfile : ''
      };

      const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error || 'Error al registrar.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl animate-fade-in shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 mb-2">TalentCollab</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Crear cuenta nueva</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              required
            />
          </div>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol a registrar</label>
            <select 
              value={role} 
              onChange={e => {
                setRole(e.target.value);
              }}
              className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="user">Usuario Reclutador (Estándar)</option>
              <option value="management">Gerente / Coordinador</option>
              <option value="admin">Administrador Global del Sistema</option>
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institución a la que perteneces</label>
              <select 
                value={institutionId} 
                onChange={e => setInstitutionId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
              >
                <option value="">-- Selecciona una Institución --</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.profile})</option>
                ))}
                <option value="NEW" className="font-bold text-blue-600">+ Registrar Nueva Institución...</option>
              </select>
            </div>

            {institutionId === 'NEW' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-4 border border-blue-100 dark:border-blue-800 animate-fade-in">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Datos de la Nueva Entidad</p>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Oficial</label>
                   <input 
                     type="text" 
                     value={newInstName} 
                     onChange={e => setNewInstName(e.target.value)} 
                     placeholder="Ej. Institución de Innovación"
                     className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                     required={institutionId === 'NEW'}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Giro / Perfil de Negocio</label>
                   <input 
                     type="text" 
                     value={newInstProfile} 
                     onChange={e => setNewInstProfile(e.target.value)} 
                     placeholder="Ej. Desarrollo Tecnológico, Salud, etc."
                     className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                     required={institutionId === 'NEW'}
                   />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30">
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
