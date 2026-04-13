import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Briefcase, Building, FileText, Clock, AlertCircle, PieChart, BarChart2, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ 
    totalVacancies: 0, 
    totalInstitutions: 0, 
    totalCvs: 0, 
    cvsInProcess: 0,
    requestStats: { requested: 0, sent: 0, open: 0 },
    vacanciesByInst: [],
    cvsByInst: [],
    cvDebt: [],
    cvsInProcessList: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/metrics');
        const data = await res.json();
        // Defensive: preserve structure if backend is missing fields or returning an error
        setMetrics(prev => ({
          ...prev,
          ...data,
          requestStats: data?.requestStats || prev.requestStats,
          vacanciesByInst: Array.isArray(data?.vacanciesByInst) ? data.vacanciesByInst : [],
          cvsByInst: Array.isArray(data?.cvsByInst) ? data.cvsByInst : [],
          cvDebt: Array.isArray(data?.cvDebt) ? data.cvDebt : [],
          cvsInProcessList: Array.isArray(data?.cvsInProcessList) ? data.cvsInProcessList : []
        }));
      } catch (e) {
        console.error("Error fetching metrics", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'Total Vacantes', value: metrics?.totalVacancies || 0, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Instituciones Red', value: metrics?.totalInstitutions || 0, icon: Building, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { title: 'CVs Totales', value: metrics?.totalCvs || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'CVs en Proceso', value: metrics?.cvsInProcess || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const requestStats = metrics?.requestStats || { requested: 0, sent: 0, open: 0 };
  const vacanciesByInst = Array.isArray(metrics?.vacanciesByInst) ? metrics.vacanciesByInst : [];
  const cvsByInst = Array.isArray(metrics?.cvsByInst) ? metrics.cvsByInst : [];
  const cvDebt = Array.isArray(metrics?.cvDebt) ? metrics.cvDebt : [];
  const cvsInProcessList = Array.isArray(metrics?.cvsInProcessList) ? metrics.cvsInProcessList : [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Panel de Control Estratégico</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Indicadores de gestión y colaboración inter-institucional.</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Estatus del Operador</p>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">Administrador Global</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-3xl flex items-center gap-5 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 group">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-12 block rounded mt-1"></span> : (stat.value || 0)}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN DE CANDIDATOS EN PROCESO (NUEVO) */}
      <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden border-2 border-indigo-500/10 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-[10rem] -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-indigo-500 w-5 h-5"/> Candidatos en Proceso de Colaboración</h3>
             <p className="text-sm text-slate-500 font-medium">Desglose detallado de talento activo vinculando origen y destino.</p>
           </div>
           <div className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-2">
             <TrendingUp className="w-4 h-4" /> {cvsInProcessList.length} Candidatos activos
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Candidato</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Vacante</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Institución Dueña</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Origen Talento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {cvsInProcessList.map((cv, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">{cv.name?.charAt(0)}</div>
                       <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">{cv.name}</span>
                    </div>
                  </td>
                  <td className="py-5">
                     <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold ring-1 ring-blue-500/20">{cv.vacancyRole}</span>
                  </td>
                  <td className="py-5">
                     <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{cv.targetInstitution}</span>
                  </td>
                  <td className="py-5 text-right">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                       {cv.sourceInstitution}
                    </span>
                  </td>
                </tr>
              ))}
              {cvsInProcessList.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 font-medium italic">No hay candidatos actualmente en proceso.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[4rem] group-hover:scale-125 transition-transform duration-700"></div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2"><PieChart className="text-blue-500 w-5 h-5"/> Estatus de Solicitudes</h3>
           
           <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Solicitado (Pendiente)</span>
                   <span className="text-xl font-black text-blue-600">{requestStats.requested || 0}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(requestStats.requested / (requestStats.open || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Enviado (Respuestas)</span>
                   <span className="text-xl font-black text-emerald-600">{requestStats.sent || 0}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(requestStats.sent / (requestStats.open || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
                   <span className="text-sm font-black uppercase tracking-widest">Total Trámites Abiertos</span>
                   <span className="text-2xl font-black">{requestStats.open || 0}</span>
                </div>
              </div>
           </div>
        </div>

        <div className="xl:col-span-2 glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2"><BarChart2 className="text-indigo-500 w-5 h-5"/> Volumen Institucional</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Vacantes Publicadas</h4>
                 <div className="space-y-4">
                    {vacanciesByInst.map((inst, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <span className="w-24 text-xs font-bold text-slate-500 truncate">{inst.name}</span>
                         <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(inst.count / (metrics?.totalVacancies || 1)) * 100}%` }}></div>
                         </div>
                         <span className="text-xs font-black text-slate-900 dark:text-white">{inst.count}</span>
                      </div>
                    ))}
                    {vacanciesByInst.length === 0 && <p className="text-xs text-slate-400 italic">Esperando datos...</p>}
                 </div>
              </div>

              <div>
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Aportación de CVs</h4>
                 <div className="space-y-4">
                    {cvsByInst.map((inst, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <span className="w-24 text-xs font-bold text-slate-500 truncate">{inst.name}</span>
                         <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${(inst.count / (metrics?.totalCvs || 1)) * 100}%` }}></div>
                         </div>
                         <span className="text-xs font-black text-slate-900 dark:text-white">{inst.count}</span>
                      </div>
                    ))}
                    {cvsByInst.length === 0 && <p className="text-xs text-slate-400 italic">Esperando datos...</p>}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden border-2 border-red-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-bl-[10rem] -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><AlertCircle className="text-red-500 w-5 h-5"/> Reporte de Deuda de CVs</h3>
             <p className="text-sm text-slate-500 font-medium">Instituciones que han recibido solicitudes pero aún no han aportado perfiles.</p>
           </div>
           <div className="px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
             <TrendingUp className="w-4 h-4" /> Alerta de SLA: {cvDebt.length} Instituciones con retraso
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institución Aportadora</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Solicitudes Pendientes</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Gravedad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {cvDebt.map((debt, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-5 font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">{debt.name}</td>
                  <td className="py-5">
                     <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-black">{debt.count} Trámites</span>
                  </td>
                  <td className="py-5 text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${debt.count > 2 ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-amber-100 text-amber-700'}`}>
                       {debt.count > 2 ? 'Crítica' : 'Moderada'}
                    </span>
                  </td>
                </tr>
              ))}
              {cvDebt.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-12 text-center">
                    <div className="space-y-2">
                       <p className="text-xl">☀️</p>
                       <p className="text-sm font-bold text-slate-400">No hay deudas activas. Todo el talento ha sido entregado a tiempo.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
