import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { FileText, Plus, AlertCircle } from 'lucide-react';

const CVs = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCvs = async () => {
    try {
      const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/cvs');
      const data = await res.json();
      // Local view: Only CVs that are purely local and unassigned
      setCvs(data.filter(c => !c.targetVacancyId && !c.targetInstitutionId));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCvs(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!file) {
      setError('Por favor selecciona un archivo de documento.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('sourceInstitutionId', user.institutionId);
    formData.append('document', file);

    try {
      const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/cvs', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccess('CV registrado correctamente. Ahora está "Disponible".');
      setForm({ name: '', email: '' });
      setFile(null);
      const fileInput = document.getElementById('cv-file-input');
      if (fileInput) fileInput.value = '';
      fetchCvs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCv = async (cvId) => {
    if (!window.confirm("¿Eliminar este perfil de manera irreversible? Se removerá también de las vacantes y trámites en los que participe.")) return;
    try {
      const res = await fetch(`https://paleturquoise-stork-428174.hostingersite.com/api/cvs/${cvId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchCvs();
    } catch(err) { alert(err.message) }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de CVs</h1>
        <p className="text-slate-500 dark:text-slate-400">Carga manual y visualización de currículums aportados por tu institución.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl h-fit">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" /> Nuevo Perfil
          </h3>
          <p className="text-xs text-slate-500 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
            <strong>Estatutos de Colaboración:</strong> Al registrar un CV, quedará estrictamente etiquetado y acreditado permanentemente a tu Institución ({user?.institutionId || 'Ninguna'}).
          </p>
          
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4 border border-red-200 dark:border-red-800">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm mb-4 border border-emerald-200 dark:border-emerald-800">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico (Validación)</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Documento (PDF/Word)</label>
              <input 
                id="cv-file-input"
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={e => setFile(e.target.files[0])} 
                className="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-400" 
                required 
              />
            </div>
            <button type="submit" disabled={!user?.institutionId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all">
              {user?.institutionId ? 'Aportar CV a la Red' : 'Bloqueado: Falta Institución Origen'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Base de Talentos ({cvs.length})</h3>
          {loading ? (
             <div className="text-center py-8"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto"></div></div>
          ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-800">
                     <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Candidato</th>
                     <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Documento</th>
                     <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Estatus</th>
                     <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Institución Propietaria</th>
                     <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Asignación / Destino</th>
                     {user?.role === 'admin' && <th className="py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Acciones</th>}
                   </tr>
                 </thead>
                 <tbody>
                   {cvs.length === 0 ? (
                     <tr><td colSpan={user?.role === 'admin' ? "6" : "5"} className="py-8 text-center text-slate-500">No hay perfiles registrados.</td></tr>
                   ) : cvs.map(cv => (
                     <tr key={cv.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="py-4 px-4">
                         <div className="font-medium text-slate-900 dark:text-white">{cv.name}</div>
                         <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                            <span>{cv.email}</span>
                            <span className="font-medium text-blue-500 shrink-0">Publicado: {new Date(cv.createdAt).toLocaleDateString()}</span>
                         </div>
                       </td>
                       <td className="py-4 px-4">
                         <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                           <FileText className="w-4 h-4 text-slate-400" />
                           <a href={`https://paleturquoise-stork-428174.hostingersite.com/uploads/${cv.document}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                             {cv.document}
                           </a>
                         </div>
                       </td>
                       <td className="py-4 px-4">
                         <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                            cv.status === 'Disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' :
                            cv.status === 'En Proceso' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400' :
                            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'
                         }`}>
                           {cv.status}
                         </span>
                       </td>
                       <td className="py-4 px-4 text-sm">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-bold text-[10px] uppercase tracking-wider ring-1 ring-slate-200 dark:ring-slate-700">
                             {cv.sourceInstitutionName || cv.sourceInstitutionId || 'Directa'}
                          </span>
                       </td>
                       <td className="py-4 px-4 text-sm">
                         {cv.targetVacancyId ? (
                           <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 p-2 flex flex-col items-start gap-1 rounded-md font-medium text-[11px] leading-tight max-w-[180px]">
                             <strong className="text-[10px] uppercase tracking-wider text-blue-800 dark:text-blue-400">Postulación Vacante</strong>
                             Vacante: {cv.targetVacancyId.role || cv.targetVacancyId}
                             <br/>Institución Destino: Inst. {cv.targetVacancyId.institutionId || '?'}
                           </span>
                         ) : cv.targetInstitutionId ? (
                           <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-2 rounded-md font-medium text-xs flex flex-col items-start gap-1">
                             <strong className="text-[10px] uppercase tracking-wider text-indigo-800 dark:text-indigo-400">Trámite SLA Asignado a:</strong>
                             {cv.targetInstitutionId}
                           </span>
                         ) : (
                           <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-medium text-xs">Base Local Interna</span>
                         )}
                       </td>
                       {user?.role === 'admin' && (
                         <td className="py-4 px-4">
                           <button onClick={() => handleDeleteCv(cv.id)} className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 font-bold transition-colors">
                             Eliminar
                           </button>
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CVs;
