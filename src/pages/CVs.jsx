import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { FileText, Plus } from 'lucide-react';
import { API_URL } from '../config';

const REJECTION_CODES = {
  'A': 'NO CUMPLE CON EL PERFIL DE LA VACANTE',
  'B': 'ESCOLARIDAD',
  'C': 'ENTREVISTA INICIAL',
  'D': 'EXAMEN PSICOMÉTRICO',
  'E': 'SE CUBRIÓ LA VACANTE',
  'F': 'DISPONIBILIDAD DE HORARIO Y/O LUGAR DE RESIDENCIA',
  'G': 'PERIODOS INESTABLES ESCOLAR Y/O LABORAL',
  'H': 'PERIODOS DE INACTIVIDAD',
  'I': 'OTRO'
};

const CVs = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRejectionCv, setSelectedRejectionCv] = useState(null);

  const fetchCvs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cvs`);
      const data = await res.json();
      // Global view: Only CVs that are purely local OR rejected (archived)
      setCvs(data.filter(c => c.status === 'Rechazado' || (!c.targetVacancyId && !c.targetInstitutionId)));
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
      const res = await fetch(`${API_URL}/api/cvs`, {
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
      const res = await fetch(`${API_URL}/api/cvs/${cvId}`, { method: 'DELETE' });
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
                           <a href={`${API_URL}/uploads/${cv.document}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                             {cv.document}
                           </a>
                         </div>
                       </td>
                        <td className="py-4 px-4">
                          {cv.status === 'Rechazado' ? (
                            <div 
                              className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedRejectionCv(cv)}
                            >
                              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 w-fit">
                                Rechazado 👉
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cód: {cv.rejectionCode || '?'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Sin estatus</span>
                          )}
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

      {selectedRejectionCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Motivo de Rechazo</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">Detalles del descarte de <strong className="text-slate-700 dark:text-slate-300">{selectedRejectionCv.name}</strong></p>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/50">
                <span className="block text-[10px] uppercase tracking-widest font-black text-red-600 dark:text-red-400 mb-1">Código de Rechazo</span>
                {selectedRejectionCv.rejectionCode ? (
                  <span className="text-sm font-bold text-red-900 dark:text-white">
                    {selectedRejectionCv.rejectionCode} - {REJECTION_CODES[selectedRejectionCv.rejectionCode] || 'Motivo no registrado'}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-500 italic">No especificado (Rechazo antiguo)</span>
                )}
              </div>

              {(selectedRejectionCv.rejectionCode === 'I' || selectedRejectionCv.rejectionReasonCustom) && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Motivo Detallado (Otro)</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedRejectionCv.rejectionReasonCustom || 'No se proporcionó detalle.'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button 
                onClick={() => setSelectedRejectionCv(null)} 
                className="px-6 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CVs;
