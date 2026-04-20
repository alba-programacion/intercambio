import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Building, Users, FileText, CheckSquare, LogOut, Menu, Book, Bell, Check } from 'lucide-react';
import { useAuth } from '../App';
import { API_URL } from '../config';
import logoAMIB from '../assets/logoamib.jpg';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'user' || !user.institutionId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/${user.institutionId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) { console.error('Failed to fetch notifications'); }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.readBy.includes(user?.id)).length;

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readBy: [...n.readBy, user.id] } : n));
    } catch (e) { console.error(e); }
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
          <div className="mb-4 flex justify-center">
            <div className="bg-white p-1 rounded-full shadow-md border border-slate-100 h-24 w-24 flex items-center justify-center overflow-hidden">
              <img src={logoAMIB} alt="AMIB Logo" className="h-full w-full object-contain" />
            </div>
          </div>
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
              // El perfil de usuario (role: 'universidad') solo tendrá acceso a vacantes y CVs
              if (user?.role === 'universidad' && item.to !== '/vacantes' && item.to !== '/cvs') return false;
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
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2">{user?.role === 'universidad' ? 'Universidad' : user?.role}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col animate-fade-in p-4 lg:p-8 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between mb-6 glass-panel p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white p-0.5 rounded-full h-14 w-14 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
              <img src={logoAMIB} alt="AMIB Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 leading-none">TalentCollab</span>
              <p className="text-xs font-bold text-slate-500">{user?.institutionName || 'Admin'}</p>
            </div>
          </div>
          <button className="p-2"><Menu className="w-5 h-5"/></button>
        </div>

        {/* Global Desktop Header Welcome */}
        <div className="hidden md:flex justify-between items-center mb-8 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Bienvenido, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Estás operando bajo la jurisdicción de <strong className="text-slate-700 dark:text-slate-300 font-bold">¡{user?.institutionName || 'Centro de Administración'}!</strong>
            </p>
          </div>
          <div className="flex gap-3 items-center">
             {/* Notification Bell */}
             {user && user.role !== 'user' && (
               <div className="relative">
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                 >
                   <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                   {unreadCount > 0 && (
                     <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 box-content border-2 border-white dark:border-slate-800 text-[8px] font-black items-center justify-center text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                     </span>
                   )}
                 </button>

                 {/* Notifications Dropdown */}
                 {showNotifications && (
                   <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[60] animate-fade-in flex flex-col max-h-[85vh]">
                     <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                       <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <Bell className="w-4 h-4 text-indigo-500" /> Notificaciones
                       </h3>
                       {unreadCount > 0 && <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">{unreadCount} nuevas</span>}
                     </div>
                     <div className="overflow-y-auto w-full custom-scrollbar flex-1">
                       {notifications.length === 0 ? (
                         <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                            <CheckSquare className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
                            No tienes notificaciones
                         </div>
                       ) : (
                         <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                           {notifications.map(n => {
                             const isUnread = !n.readBy.includes(user?.id);
                             return (
                               <div 
                                 key={n._id} 
                                 className={`p-4 transition-colors ${isUnread ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                 onClick={() => {
                                   if (isUnread) handleMarkAsRead(n._id);
                                   if (n.link) {
                                      navigate(n.link);
                                      setShowNotifications(false);
                                   }
                                 }}
                               >
                                 <div className="flex justify-between items-start gap-3">
                                   <div className="flex-1 cursor-pointer">
                                     <div className="flex items-center gap-2 mb-1">
                                        <span className={`h-2 w-2 rounded-full ${n.type === 'SUCCESS' ? 'bg-emerald-500' : n.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{new Date(n.createdAt).toLocaleString([], {hour: '2-digit', minute:'2-digit', day:'2-digit', month: 'short'})}</p>
                                     </div>
                                     <p className={`text-sm ${isUnread ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>{n.message}</p>
                                   </div>
                                   {isUnread && (
                                     <button 
                                       onClick={(e) => handleMarkAsRead(n._id, e)}
                                       className="shrink-0 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                       title="Marcar como leída"
                                     >
                                       <Check className="w-4 h-4" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             )}

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
