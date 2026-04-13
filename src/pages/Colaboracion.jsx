import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Send, Inbox, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

const Colaboracion = () => {
  const { user } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recibidos');
  
  // For sending SLA
  const [applyForm, setApplyForm] = useState({ name: '', description: '', targetEmail: '', dueDate: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [collabError, setCollabError] = useState('');
  const [collabSuccess, setCollabSuccess] = useState('');
  
  const getInstName = (id) => {
    if (!id) return null;
    const inst = institutions.find(i => i.id === id || i._id === id);
    return inst ? inst.name : id;
  };

  const fetchData = async () => {
    try {
      const [cvsRes, instRes, tasksRes] = await Promise.all([
        fetch('https://paleturquoise-stork-428174.hostingersite.com/api/cvs'),
        fetch('https://paleturquoise-stork-428174.hostingersite.com/api/institutions'),
        fetch(`https://paleturquoise-stork-428174.hostingersite.com/api/tasks?email=${user.email}`)
      ]);
      setCvs(await cvsRes.json());
      setInstitutions(await instRes.json());
      setTasks(await tasksRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // CVs recibidos en mi institución
  const incomingCvs = cvs.filter(c => c.targetInstitutionId === user.institutionId && c.status === 'En Proceso');
  // CVs enviados por mi institución que están en proceso o disponibles para ser enviados
  const myAvailableCvs = cvs.filter(c => c.sourceInstitutionId === user.institutionId && c.status === 'Disponible');
  const mySentCvs = cvs.filter(c => c.sourceInstitutionId === user.institutionId && c.targetInstitutionId);

  const handleShareSla = async (e) => {
    e.preventDefault();
    setCollabError(''); setCollabSuccess('');
    if (!documentFile) return setCollabError('Por favor adjunta el CV (PDF/Word).');
    
    const formData = new FormData();
    formData.append('name', applyForm.name);
    formData.append('description', applyForm.description);
    formData.append('targetEmail', applyForm.targetEmail);
    formData.append('dueDate', applyForm.dueDate);
    formData.append('senderEmail', user.email);
    if (user.institutionId) formData.append('sourceInstitutionId', user.institutionId);
    formData.append('document', documentFile);

    try {
      const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/cvs/collab', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar CV');
      
      setCollabSuccess('¡CV enviado! Tarea SLA asignada al correo destino.');
      setApplyForm({ name: '', description: '', targetEmail: '', dueDate: '' });
      setDocumentFile(null);
      const fileInput = document.getElementById('collab-file');
      if (fileInput) fileInput.value = '';
      fetchData(); 
    } catch (err) {
      setCollabError(err.message);
    }
  };

  const completedActivity = tasks
    .filter(t => t.status === 'COMPLETED' && (t.type === 'REQUEST_CVS' || (t.type === 'REVIEW_CV' && t.description === 'Institución envío cv')))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vinculación Bilateral</h1>
        <p className="text-slate-500 dark:text-slate-400">Espacio privado para compartir y hacer seguimiento de talento entre instituciones.</p>
      </div>



      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('recibidos')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'recibidos' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Inbox className="w-5 h-5" /> Colaboraciones <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs">{completedActivity.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('enviar')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'enviar' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Send className="w-5 h-5" /> Enviar CV / Historial
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto"></div></div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl min-h-[400px]">
          {activeTab === 'recibidos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Actividad Mínima Reciente</h3>
              {completedActivity.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl max-w-lg mx-auto bg-slate-50/50 dark:bg-slate-900/50">
                  <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">No hay actividad reciente completada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedActivity.map(t => {
                    const dateStr = new Date(t.createdAt).toLocaleDateString();
                    let msg = '';
                    const actualVac = t.targetVacancyId || t.cvId?.targetVacancyId;
                    const vacancyStr = actualVac?.role ? ` para la vacante de ${actualVac.role}` : '';
                    if (t.type === 'REQUEST_CVS') {
                       if (t.senderEmail === user.email) {
                          msg = `Solicitaste CV a ${getInstName(t.targetInstitutionId) || 'la institución destino'}${vacancyStr} el ${dateStr}`;
                       } else {
                          const requesterName = getInstName(actualVac?.institutionId) || actualVac?.institutionName || 'Otra Institución';
                          msg = `${requesterName} te solicitó CV${vacancyStr} el ${dateStr}`;
                       }
                    } else if (t.type === 'REVIEW_CV' && t.description === 'Institución envío cv') {
                       if (t.senderEmail === user.email) {
                          msg = `Enviaste CV a ${getInstName(t.cvId?.targetInstitutionId || t.targetInstitutionId) || 'la institución destino'}${vacancyStr} el ${dateStr}`;
                       } else {
                          const senderName = getInstName(t.sourceInstitutionId || t.cvId?.sourceInstitutionId) || 'Otra Institución';
                          msg = `${senderName} te envió CV${vacancyStr} el ${dateStr}`;
                       }
                    }
                    return (
                      <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl flex items-center gap-3 transition-all hover:shadow-md">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm md:text-base">{msg}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enviar' && (
            <div className="space-y-8">
              <div className="bg-white/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Generar Trámite de Envío de CV (SLA)</h3>
                  <p className="text-sm text-slate-500">Al enviar el perfil, la acción quedará certificada bajo sello de colaboración para la Institución Aportadora ({user?.institutionId || 'No asignada'}).</p>
                </div>
                
                {collabError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 border border-red-200">{collabError}</div>}
                {collabSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm mb-4 border border-emerald-200">{collabSuccess}</div>}

                <form onSubmit={handleShareSla} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Candidato</label>
                      <input type="text" value={applyForm.name} onChange={e=>setApplyForm({...applyForm, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">¿A qué correo asignar la Tarea SLA?</label>
                      <input type="email" value={applyForm.targetEmail} onChange={e=>setApplyForm({...applyForm, targetEmail: e.target.value})} placeholder="gerente@institucion.com" className="w-full px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-red-600 dark:text-red-400 mb-1">🚨 Fecha Límite de SLA</label>
                      <input type="date" value={applyForm.dueDate} onChange={e=>setApplyForm({...applyForm, dueDate: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10 dark:text-white outline-none focus:ring-2 focus:ring-red-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Mensaje de presentación (Cuerpo del correo)</label>
                    <textarea value={applyForm.description} onChange={e=>setApplyForm({...applyForm, description: e.target.value})} rows="3" className="w-full px-4 py-2 rounded-xl border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" required></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Archivo CV (PDF/Word)</label>
                    <input id="collab-file" type="file" onChange={e=>setDocumentFile(e.target.files[0])} accept=".pdf,.doc,.docx" className="w-full px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 dark:text-white transition-colors cursor-pointer" required />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={!user?.institutionId} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all text-lg flex justify-center items-center gap-2">
                      <Send className="w-5 h-5"/> {user?.institutionId ? 'Enviar y Generar Trámite' : 'Envío Bloqueado (Sin Institución)'}
                    </button>
                  </div>
                 </form>
              </div>

              {mySentCvs.length > 0 && (
                <div className="bg-white/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mt-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Historial de CVs Enviados</h3>
                  <div className="space-y-4">
                    {mySentCvs.map(cv => (
                      <div key={cv.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-400 transition-colors">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                             {cv.name} 
                             <span className={`px-2 py-0.5 text-[10px] uppercase font-black tracking-wider rounded-md ${cv.status === 'Rechazado' ? 'bg-red-100 text-red-700' : cv.status === 'Aprobado' || cv.status === 'Contratado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{cv.status}</span>
                          </h4>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            Enviaste cv a <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded mx-1">{cv.targetInstitutionId}</span> ({cv.targetVacancyId?.role || 'Puesto no especificado'}).
                          </p>
                        </div>
                        <a href={`https://paleturquoise-stork-428174.hostingersite.com/uploads/${cv.document}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 flex items-center gap-2 shrink-0"><FileText className="w-4 h-4"/> Ver Archivo</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Colaboracion;
