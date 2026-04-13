import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Building, Users, FileText, CheckSquare, LogOut, Menu, Book } from 'lucide-react';
import { useAuth } from '../App';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
    { to: '/vacantes', icon: Briefcase, label: 'Vacantes' },
    { to: '/tareas', icon: CheckSquare, label: 'Mis Trámites' },
    { to: '/colaboracion', icon: Users, label: 'Colaboración' },
    { to: '/cvs', icon: FileText, label: 'Gestión de CVs' },
    { to: '/instituciones', icon: Building, label: 'Instituciones', adminOnly: true },
    { to: '/directorio', icon: Book, label: 'Directorio' },
  ];

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex flex-col m-4 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 hidden md:flex">
        <div className="p-6 text-center border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
            TalentCollab
          </h1>
          <div className="mt-4 p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 dark:text-indigo-400 mb-1">Institución Emisora</p>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
              {user?.institutionName || 'Administración Global'}
            </p>
          </div>
          

        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.filter(item => {
             if (item.adminOnly && user?.role !== 'admin') return false;
             // El perfil de usuario (role: 'user') solo tendrá acceso a vacantes y CVs
             if (user?.role === 'user' && item.to !== '/vacantes' && item.to !== '/cvs') return false;
             return true;
          }).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="truncate max-w-[120px]">{user?.email}</span>
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2">{user?.role}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col animate-fade-in p-4 lg:p-8 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between mb-6 glass-panel p-4 rounded-xl shadow-sm">
          <div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 leading-none">TalentCollab</span>
            <p className="text-xs font-bold text-slate-500">{user?.institutionName || 'Admin'}</p>
          </div>
          <button className="p-2"><Menu className="w-5 h-5"/></button>
        </div>

        {/* Global Desktop Header Welcome */}
        <div className="hidden md:flex justify-between items-center mb-8 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Bienvenido, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Estás operando bajo la jurisdicción de <strong className="text-slate-700 dark:text-slate-300 font-bold">¡{user?.institutionName || 'Centro de Administración'}!</strong>
            </p>
          </div>
          <div className="flex gap-3">
             <div className="h-10 w-10 shadow-sm rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-lg">
               {user?.name?.charAt(0).toUpperCase()}
             </div>
          </div>
        </div>
        
        <div className="max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
