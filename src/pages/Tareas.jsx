import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Calendar, AlertCircle, CheckCircle2, FileText, Banknote, X } from 'lucide-react';

const Tareas = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [outcome, setOutcome] = useState('Aprobado');
  const [rejectedReason, setRejectedReason] = useState('');
  const [myVacancies, setMyVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('pendientes');

  // Fulfilling requests
  const [applyForm, setApplyForm] = useState({ name: '', email: '' });
  const [documentFile, setDocumentFile] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks?email=${user.email}`);
      const data = await res.json();
      setTasks(data);
    } catch(e) { console.error(e) }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetch('http://localhost:5000/api/vacancies')
        .then(res => res.json())
        .then(data => {
           setMyVacancies(data.filter(v => v.institutionId === user.institutionId && v.status !== 'Cerrada'));
        })
        .catch(() => {});
    }
  }, [user]);

  const handleResolve = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    try {
      const isReceiptOnly = selectedTask.description === 'Institución rechazó el CV' || selectedTask.description === 'Institución aceptó el CV' || selectedTask.description === 'Institución envío cv';
      if (!isReceiptOnly) {
        if (!selectedVacancyId) {
           setError('Debes seleccionar una opción en el menú de vacantes.');
           return;
        }
        const actualOutcome = selectedVacancyId === 'NO_VACANCY' ? 'Rechazado' : 'Aprobado';
        const actualReason = selectedVacancyId === 'NO_VACANCY' ? 'No hay vacante para este perfil' : '';
        
        // 1. Update CV Status
        const resCv = await fetch(`http://localhost:5000/api/cvs/${selectedTask.cvId._id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: actualOutcome, rejectedReason: actualReason, rejectedBy: user.email, targetVacancyId: actualOutcome === 'Aprobado' ? selectedVacancyId : null })
        });
        if(!resCv.ok) throw new Error('Error al actualizar status del CV');
      }
      
      // 2. Complete Task
      const resTask = await fetch(`http://localhost:5000/api/tasks/${selectedTask.id}/complete`, {
        method: 'PATCH'
      });
      if(!resTask.ok) throw new Error('Error al completar la tarea');
      
      setSuccess('¡Tarea resuelta exitosamente!');
      setSelectedTask(null);
      fetchTasks();
    } catch(err) { setError(err.message); }
  };

  const handleFulfillCv = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!documentFile) return setError('Por favor adjunta el CV (PDF/Word).');
    
    const formData = new FormData();
    formData.append('name', applyForm.name);
    formData.append('email', applyForm.email);
    formData.append('senderEmail', user.email);
    if (user.institutionId) formData.append('sourceInstitutionId', user.institutionId);
    formData.append('document', documentFile);

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${selectedTask.id}/fulfill-cv`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar CV');
      
      setSuccess('¡CV enviado exitosamente a la institución solicitante!');
      setApplyForm({ name: '', email: '' });
      setDocumentFile(null);
      setSelectedTask(null);
      fetchTasks(); 
    } catch(err) { setError(err.message); }
  };

  const validTasks = tasks.filter(t => !(t.senderEmail === user?.email && (t.type === 'REQUEST_CVS' || t.description === 'Institución rechazó el CV' || t.description === 'Institución aceptó el CV')));
  const isReceiptOnly = selectedTask && (selectedTask.description === 'Institución rechazó el CV' || selectedTask.description === 'Institución aceptó el CV' || selectedTask.description === 'Institución envío cv');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bandeja de Trámites y Tareas</h1>
        <p className="text-slate-500 dark:text-slate-400">Revisa las postulaciones directas y evita multas por vencimiento.</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('pendientes')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'pendientes' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Trámites Pendientes <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs">{validTasks.filter(t => t.status !== 'COMPLETED').length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('completadas')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'completadas' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Historial (Completadas)
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {validTasks.filter(t => activeTab === 'pendientes' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED').map(t => {
            const actualVac = t.targetVacancyId || t.cvId?.targetVacancyId;
            return (
            <div key={t.id} className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden transition-all ${t.status === 'COMPLETED' ? 'opacity-60 grayscale-[50%]' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${t.status==='COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                  <span className="text-sm text-slate-500 font-medium">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center flex-wrap gap-2">
                  {t.type === 'REQUEST_CVS' ? 
                     (t.senderEmail === user.email ? 
                         `Solicitaste CV a ${t.targetInstitutionId || 'Otra Institución'}${actualVac?.role ? ` para la vacante de ${actualVac.role}` : ''}` : 
                         `${actualVac?.institutionName || actualVac?.institutionId || 'Otra Institución'} te solicitó CV${actualVac?.role ? ` para la vacante de ${actualVac.role}` : ''}`)
                   :
                   t.type === 'REVIEW_CV' && t.description === 'Institución envío cv' ? 
                     (t.senderEmail === user.email ? 
                        `Enviaste cv a ${t.cvId?.targetInstitutionId || 'Destino'}${actualVac?.role ? ` para la vacante de ${actualVac.role}` : ''}` : 
                        `${t.cvId?.sourceInstitutionId || 'Externa'} envió cv a tu vacante${actualVac?.role ? ` de ${actualVac.role}` : ''}`)  
                   :
                   t.type === 'REVIEW_CV' && t.description === 'Institución rechazó el CV' ? `❌ ${t.cvId?.targetInstitutionId || 'La Institución destino'} rechazó tu CV de ${t.cvId?.name}` :
                   t.type === 'REVIEW_CV' && t.description === 'Institución aceptó el CV' ? `✅ ${t.cvId?.targetInstitutionId || 'La Institución destino'} aceptó tu CV de ${t.cvId?.name}` :
                   'Revisión de Candidato: ' + t.cvId?.name} 
                  {t.senderEmail === user.email ? (
                    <span className="text-[10px] uppercase tracking-wider bg-purple-100 text-purple-700 font-black px-2 py-1 rounded-lg">
                      Enviado por nosotros a {t.type === 'REQUEST_CVS' ? t.targetInstitutionId : (t.description === 'Institución envío cv' ? t.cvId?.targetInstitutionId : ((t.description === 'Institución aceptó el CV' || t.description === 'Institución rechazó el CV') ? (t.cvId?.sourceInstitutionName || t.cvId?.sourceInstitutionId) : t.targetEmail)) || 'Destino'}
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 font-black px-2 py-1 rounded-lg">Recibido</span>
                  )}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 italic">"{t.description}"</p>
                
                <div className="flex flex-col gap-2 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400"><FileText className="w-4 h-4"/> Vacante Objetivo: {actualVac?.role || 'Bolsa General'}</div>
                  <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><Banknote className="w-4 h-4"/> {t.type === 'REQUEST_CVS' ? `Solicitado por: ${t.senderEmail}` : `Origen del CV: ${t.cvId?.sourceInstitutionId || 'Directa'} (Enviado por: ${t.senderEmail})`}</div>
                </div>
              </div>
              
              {/* SLA & FINE SECTION */}
              <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center text-center">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Límite SLA</h4>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">{new Date(t.dueDate).toLocaleDateString()}</p>
                
                {t.status !== 'COMPLETED' && (
                  <div className={`p-3 rounded-xl w-full flex flex-col items-center justify-center gap-1 font-bold ${t.fine > 0 ? 'bg-red-100 text-red-700 border border-red-200 shadow-xl shadow-red-500/20' : 'bg-emerald-50 text-emerald-600'}`}>
                    {t.fine > 0 ? <><AlertCircle className="w-5 h-5"/> Multa Activa:<br/> <span className="text-2xl">${t.fine}</span></> : <><CheckCircle2 className="w-5 h-5"/> A tiempo <br/><span className="text-xs font-medium">(Sin multas)</span></>}
                  </div>
                )}
                {t.status === 'COMPLETED' && (
                   <div className="text-indigo-600 font-semibold flex flex-col items-center gap-2"><CheckCircle2 className="w-6 h-6"/> Trámite Resuelto</div>
                )}
              </div>
              
              {t.status !== 'COMPLETED' && (
                <div className="flex items-center">
                  {t.senderEmail !== user.email ? (
                    <button onClick={()=>setSelectedTask(t)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium w-full md:w-auto h-fit shadow-xl shadow-indigo-500/30">Resolver</button>
                  ) : (
                    <button onClick={()=>setSelectedTask(t)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-medium w-full md:w-auto h-fit border border-slate-200 dark:border-slate-700 transition-colors">Ver Detalles ({t.status})</button>
                  )}
                </div>
              )}
            </div>
          )})}
          {validTasks.filter(t => activeTab === 'pendientes' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED').length === 0 && (
            <div className="glass-panel p-12 rounded-3xl text-center">
              <CheckCircle2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Al día</h3>
              <p className="text-slate-500">No tienes tareas asignadas a tu correo en este momento.</p>
            </div>
          )}
        </div>
      )}

      {/* RESOLVE MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-10 animate-fade-in" onClick={()=>setSelectedTask(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-panel" onClick={e=>e.stopPropagation()}>
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center relative">
               <h2 className="text-xl font-bold dark:text-white">Dictaminar Postulación</h2>
               <button onClick={() => setSelectedTask(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X className="w-5 h-5"/></button>
             </div>
             <form onSubmit={selectedTask.type === 'REQUEST_CVS' ? handleFulfillCv : handleResolve} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}
                
                {selectedTask.type !== 'REQUEST_CVS' ? (
                  <>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 text-center border border-slate-200 dark:border-slate-700">
                      <a href={`http://localhost:5000/uploads/${selectedTask.cvId?.document}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg hover:underline"><FileText/> Ver Currículum ({selectedTask.cvId?.name})</a>
                    </div>
                    
                    {selectedTask.cvId?.history && selectedTask.cvId.history.length > 0 && (
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl mb-4 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/> Flujo del Trámite</h3>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                          {selectedTask.cvId.history.map((h, i) => (
                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-3 h-3 rounded-full border-2 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{h.action}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">{h.details}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
    
                    {selectedTask.status !== 'COMPLETED' && selectedTask.senderEmail !== user.email && (
                      <>
                        {isReceiptOnly ? (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-center text-sm font-medium mb-4">
                            {selectedTask.description === 'Institución envío cv' ? 'El CV ya fue enviado directamente a tu vacante. Entra a la red de Vacantes para revisarlo y continuar su proceso allá. Marca esta notificación de recibido como Enterado.' : 'Toma nota de esta resolución. Marca la tarea como completada para limpiar tu bandeja.'}
                          </div>
                        ) : (
                          <div className="animate-fade-in">
                            <label className="block text-sm font-medium dark:text-slate-300 mb-1">Seleccionar mi Vacante</label>
                            <select value={selectedVacancyId} onChange={e=>setSelectedVacancyId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" required>
                              <option value="" disabled>-- Seleccione una opción --</option>
                              <option value="NO_VACANCY">No hay vacante para este cv</option>
                              {myVacancies.map(v => (
                                 <option key={v.id} value={v.id}>{v.role}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    {selectedTask.senderEmail === user.email && selectedTask.status !== 'COMPLETED' && (
                      <div className="p-3 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl text-center text-sm font-medium">
                         ⏳ Tarea en manos de la institución destino. 
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {selectedTask.status === 'COMPLETED' ? (
                       <div className="p-6 bg-slate-50 dark:bg-slate-800 text-center rounded-xl border border-slate-200 dark:border-slate-700">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
                          <h3 className="font-bold text-slate-700 dark:text-slate-300">¡Solicitud Exitosamente Atendida!</h3>
                          <p className="text-sm text-slate-500 mt-2">Ya enviaste un currículum para responder a esta petición. Revisa tus otras tareas para ver si el candidato fue aceptado o rechazado por la otra institución.</p>
                       </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nombre del Candidato</label>
                          <input type="text" value={applyForm.name} onChange={e=>setApplyForm({...applyForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Correo C.</label>
                          <input type="email" value={applyForm.email} onChange={e=>setApplyForm({...applyForm, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Archivo CV (PDF/Word)</label>
                          <input type="file" onChange={e=>setDocumentFile(e.target.files[0])} accept=".pdf,.doc,.docx" className="w-full px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 dark:text-white transition-colors cursor-pointer" required />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {selectedTask.status !== 'COMPLETED' && selectedTask.senderEmail !== user.email && (
                  <button type="submit" disabled={(!isReceiptOnly && selectedTask.type !== 'REQUEST_CVS' && !selectedVacancyId) ? true : false} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all">
                    {selectedTask.type === 'REQUEST_CVS' ? 'Enviar CV y Completar Solicitud' : 
                     isReceiptOnly ? 'Entendido (Marcar de Enterado)' : 'Completar Tarea'}
                  </button>
                )}
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tareas;
