import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_URL } from '../config';
import { Building, AlertTriangle, CheckCircle, Plus, Search, DollarSign, Clock, Users, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const GestionTareas = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [fines, setFines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('multas'); // multas, tareas

  const [showFineModal, setShowFineModal] = useState(false);
  const [fineForm, setFineForm] = useState({
    institutionId: '',
    reason: 'Falta a la sesión',
    status: 'Pendiente'
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Task Fulfillment (Merged from Tareas.jsx)
  const [selectedTask, setSelectedTask] = useState(null);
  const [applyForm, setApplyForm] = useState({ name: '', email: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchJson = async (url) => {
        try {
          const res = await fetch(url);
          if (res.ok) return await res.json();
          return [];
        } catch (e) { return []; }
      };

      const instId = user?.institutionId || '';
      const tasksUrl = user?.role === 'admin' ? `${API_URL}/api/tasks` : `${API_URL}/api/tasks?institutionId=${instId}`;
      const finesUrl = user?.role === 'admin' ? `${API_URL}/api/fines` : `${API_URL}/api/fines?institutionId=${instId}`;

      console.log('User State:', user);
      console.log('Fetching tasks from:', tasksUrl);
      console.log('Fetching fines from:', finesUrl);

      const [instData, finesData, tasksData] = await Promise.all([
        fetchJson(`${API_URL}/api/institutions`),
        fetchJson(finesUrl),
        fetchJson(tasksUrl)
      ]);
      
      setInstitutions(Array.isArray(instData) ? instData : []);
      setFines(Array.isArray(finesData) ? finesData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (e) {
      console.error('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleAddFine = async (e) => {
    e.preventDefault();
    if (!fineForm.institutionId) return alert("Selecciona una institución");
    
    try {
      const res = await fetch(`${API_URL}/api/fines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fineForm,
          amount: 50.00
        })
      });
      if (res.ok) {
        setShowFineModal(false);
        fetchData();
        setFineForm({ institutionId: '', reason: 'Falta a la sesión', status: 'Pendiente' });
        showSuccessNotification("Multa aplicada exitosamente");
      } else {
        const error = await res.json();
        alert("Error al aplicar multa: " + (error.error || "Error desconocido"));
      }
    } catch (e) { 
      console.error(e); 
      alert("Error de conexión al servidor");
    }
  };

  const handleUpdateFineStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/fines/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/tasks/request-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          senderEmail: user.email,
          targetVacancyId: null // Independent task
        })
      });
      if (res.ok) {
        setShowTaskModal(false);
        fetchData();
        setTaskForm({ targetInstitutionId: '', description: '', dueDate: '' });
        showSuccessNotification("¡Solicitud enviada con éxito!");
      } else {
        const error = await res.json();
        alert("Error al enviar solicitud: " + (error.error || "Error desconocido"));
      }
    } catch (e) { 
      console.error(e); 
      alert("Error de conexión al servidor");
    }
  };

  const handleFulfillCv = async (e) => {
    e.preventDefault();
    if (resolving) return;
    if (!documentFile) return alert('Por favor adjunta el CV (PDF/Word).');
    
    setResolving(true);
    const formData = new FormData();
    formData.append('name', applyForm.name);
    formData.append('email', applyForm.email);
    formData.append('senderEmail', user.email);
    if (user.institutionId) formData.append('sourceInstitutionId', user.institutionId);
    formData.append('document', documentFile);

    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/fulfill-cv`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setSelectedTask(null);
        fetchData();
        setApplyForm({ name: '', email: '' });
        
        // Clear file input UI
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        setDocumentFile(null);
        showSuccessNotification("¡Solicitud enviada con éxito!");
        if (typeof confetti === 'function') {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        const err = await res.json();
        alert(err.error || "Error al enviar CV");
      }
    } catch(err) { alert("Error de conexión"); }
    finally { setResolving(false); }
  };

  const handleCompleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/complete`, { method: 'PATCH' });
      if (res.ok) {
        fetchData();
        showSuccessNotification("Tarea completada");
      }
    } catch(e) { console.error(e); }
  };

  const showSuccessNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const [taskForm, setTaskForm] = useState({
    targetInstitutionId: '',
    description: '',
    dueDate: ''
  });

  const reasons = [
    'Falta a la sesión',
    'No enviar el reporte o enviarlo de forma incompleta',
    'No enviar el reporte de información en la fecha establecida',
    'No enviar los candidatos que se comprometieron a compartir'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Tareas</h1>
          <p className="text-slate-500 dark:text-slate-400">Panel de control administrativo para instituciones, multas y seguimiento.</p>
        </div>
      </div>

      {/* Success Notification Overlay */}
      {successMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400/50 scale-110">
            <CheckCircle className="w-8 h-8" />
            <span className="text-xl font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('multas')}
          className={`pb-4 px-2 text-sm font-bold transition-colors relative ${activeTab === 'multas' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Multas
          {activeTab === 'multas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('tareas')}
          className={`pb-4 px-2 text-sm font-bold transition-colors relative ${activeTab === 'tareas' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Tareas
          {activeTab === 'tareas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto"></div></div>
      ) : (
        <div className="animate-fade-in">

          {activeTab === 'multas' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">Registro de Multas</h3>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowFineModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nueva Multa
                  </button>
                )}
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Institución</th>
                      <th className="px-6 py-4">Motivo</th>
                      <th className="px-6 py-4">Monto</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fines.map((f) => (
                      <tr key={f._id} className="text-sm">
                        <td className="px-6 py-4 font-bold dark:text-white">{f.institutionId?.name || f.institutionId}</td>
                        <td className="px-6 py-4 text-slate-500">{f.reason}</td>
                        <td className="px-6 py-4 font-black text-red-600">${f.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${f.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{new Date(f.date).toLocaleDateString()}</td>
                         <td className="px-6 py-4">
                          {user?.role === 'admin' && f.status === 'Pendiente' && (
                            <button 
                              onClick={() => handleUpdateFineStatus(f._id, 'Pagado')}
                              className="text-emerald-600 hover:underline font-bold"
                            >
                              Marcar Pagado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {fines.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay multas registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tareas' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold dark:text-white">Asignación de Tareas</h3>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Asignar Tarea
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {tasks.map((t) => (
                  <div key={t.id} className="glass-panel p-4 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{t.description}</p>
                        <p className="text-xs text-slate-500">Para: {t.targetEmail} | Vence: {new Date(t.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {t.status}
                      </span>
                      {t.status !== 'COMPLETED' && (
                        user?.role === 'admin' ? (
                          <button onClick={() => handleCompleteTask(t.id)} className="text-blue-600 hover:underline text-xs font-bold">Completar</button>
                        ) : (
                          (t.targetEmail === user.email || t.targetInstitutionId === user.institutionId) && (
                            <button 
                              onClick={() => setSelectedTask(t)} 
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                            >
                              Resolver
                            </button>
                          )
                        )
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">Sin tareas pendientes</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">No hay tareas asignadas en este momento. Usa el botón <span className="font-semibold text-blue-500">+ Asignar Tarea</span> para crear una nueva.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fine Modal */}
      {showFineModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Aplicar Multa</h2>
            <form onSubmit={handleAddFine} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Institución</label>
                <select 
                  value={fineForm.institutionId} 
                  onChange={e => setFineForm({...fineForm, institutionId: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                >
                  <option value="">Selecciona una empresa</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Motivo</label>
                <select 
                  value={fineForm.reason} 
                  onChange={e => setFineForm({...fineForm, reason: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/50">
                <p className="text-sm font-bold text-red-600">Monto: $50.00</p>
                <p className="text-[10px] text-red-500 mt-1">De acuerdo a los estatutos establecidos.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFineModal(false)} className="flex-1 px-4 py-2 rounded-xl border font-bold dark:text-white">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-bold">Aplicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Asignar Tarea</h2>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Institución</label>
                <select 
                  value={taskForm.targetInstitutionId} 
                  onChange={e => setTaskForm({...taskForm, targetInstitutionId: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                >
                  <option value="">Selecciona una empresa</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Fecha Límite</label>
                <input 
                  type="date" 
                  value={taskForm.dueDate} 
                  onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-slate-300">Descripción / Instrucción</label>
                <textarea 
                  value={taskForm.description} 
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                  placeholder="Ej. Institución quedó en enviar un CV..."
                  required
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 rounded-xl border font-bold dark:text-white">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">Asignar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TASK MODAL (Merged from Tareas.jsx) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-panel">
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold dark:text-white">Resolver Solicitud</h2>
               <button onClick={() => setSelectedTask(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X className="w-5 h-5"/></button>
             </div>
             <form onSubmit={handleFulfillCv} className="p-6 space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4 border border-blue-100 dark:border-blue-800/50">
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic font-medium">"{selectedTask.description}"</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Candidato</label>
                    <input type="text" value={applyForm.name} onChange={e=>setApplyForm({...applyForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ej. Juan Pérez" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                    <input type="email" value={applyForm.email} onChange={e=>setApplyForm({...applyForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="juan@ejemplo.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Archivo CV (PDF/Word)</label>
                    <input type="file" onChange={e=>setDocumentFile(e.target.files[0])} accept=".pdf,.doc,.docx" className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 dark:text-white transition-all cursor-pointer bg-slate-50 dark:bg-slate-950" required />
                  </div>
                </div>
                
                <button type="submit" disabled={resolving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all mt-4">
                  {resolving ? 'Enviando...' : 'Enviar CV y Completar Tarea'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTareas;
