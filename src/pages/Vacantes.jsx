import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Briefcase, Building, Clock, Users, FileText, X, Plus, Send } from 'lucide-react';
import { API_URL } from '../config';
import confetti from 'canvas-confetti';

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

const Vacantes = () => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [allCvs, setAllCvs] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectingCv, setRejectingCv] = useState(null);
  const [rejectionCode, setrejectionCode] = useState('');
  const [rejectionReasonCustom, setRejectionReasonCustom] = useState('');

  // Forms state
  const [form, setForm] = useState({ 
    role: '', salary: '', location: '', modality: 'Presencial',
    knowledgeTest: '', language: '', activities: '', confidential: false,
    age: '', gender: 'Indistinto', skills: '', institutionId: ''
  });
  const [applyForm, setApplyForm] = useState({ name: '', email: '' });
  const [requestCvForm, setRequestCvForm] = useState({ targetInstitutionId: '', description: '', dueDate: '' });
  const [documentFile, setDocumentFile] = useState(null);
  
  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVacancies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vacancies`);
      const data = await res.json();
      setVacancies(data);
    } catch (e) {
      console.error("Error", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCvs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cvs`);
      const data = await res.json();
      const normalizedData = data.map(c => ({
        ...c,
        targetVacancyId: c.targetVacancyId?._id || c.targetVacancyId
      }));
      setAllCvs(normalizedData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const [resVacs, resInsts] = await Promise.all([
        fetch(`${API_URL}/api/vacancies`),
        fetch(`${API_URL}/api/institutions`)
      ]);
      const vacsData = await resVacs.json();
      const instsData = await resInsts.json();
      setVacancies(Array.isArray(vacsData) ? vacsData : []);
      setInstitutions(Array.isArray(instsData) ? instsData : []);
    } catch(e) { console.error(e) }
  };

  useEffect(() => {
    fetchVacancies();
    if (user) {
      fetchAllCvs();
      fetchInstitutions(); // all users need institutions list to publish vacancies
    }
  }, [user]);

  const handleAddVacancy = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    if (!user?.institutionId) {
      setError('No tienes una institución asignada para publicar esta vacante.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vacancies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, institutionId: user?.institutionId })
      });
      if (!res.ok) throw new Error('Error al crear vacante');
      setForm({ 
        role: '', salary: '', location: '', modality: 'Presencial',
        knowledgeTest: '', language: '', activities: '', confidential: false,
        age: '', gender: 'Indistinto', skills: '', institutionId: ''
      });
      setShowAddModal(false);
      fetchVacancies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplyCv = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!documentFile) return setError('Por favor adjunta el CV (PDF/Word).');
    
    const formData = new FormData();
    formData.append('name', applyForm.name);
    formData.append('email', applyForm.email);
    formData.append('targetVacancyId', selectedVacancy.id);
    if (user.institutionId) formData.append('sourceInstitutionId', user.institutionId);
    formData.append('document', documentFile);

    try {
      const res = await fetch(`${API_URL}/api/cvs/vacancy`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar CV');
      
      setSuccess('¡CV postulado exitosamente a la vacante!');
      setApplyForm({ name: '', email: '' });
      setDocumentFile(null);
      fetchVacancies(); 
      fetchAllCvs();
      setSelectedVacancy(prev => ({...prev, cvCount: prev.cvCount + 1}));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateCvStatus = async (cvId, newStatus, extraData = {}) => {
    if (newStatus === 'Rechazado' && !extraData.rejectionCode) {
      setRejectingCv(cvId);
      setShowRejectionModal(true);
      return;
    }

    if (newStatus === 'Aceptado') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#4f46e5', '#10b981']
      });
    }

    try {
      const body = { status: newStatus, rejectedBy: user?.institutionName || 'Institución', ...extraData };
      const res = await fetch(`${API_URL}/api/cvs/${cvId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al actualizar status');
      
      fetchAllCvs(); // refresh the list
      
      if (newStatus === 'Rechazado') {
         setSelectedVacancy(prev => prev ? ({...prev, cvCount: prev.cvCount - 1}) : null);
         setShowRejectionModal(false);
         setRejectingCv(null);
         setrejectionCode('');
         setRejectionReasonCustom('');
      }
    } catch(err) { alert(err.message) }
  };

  const handleConfirmRejection = (e) => {
    e.preventDefault();
    if (!rejectionCode) return alert("Selecciona una clave de rechazo");
    if (rejectionCode === 'I' && !rejectionReasonCustom.trim()) return alert("Favor de especificar el motivo");
    
    handleUpdateCvStatus(rejectingCv, 'Rechazado', { 
      rejectionCode, 
      rejectionReasonCustom: rejectionCode === 'I' ? rejectionReasonCustom : '' 
    });
  };

  const handleUpdateVacancyStatus = async (vacancyId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Error al actualizar status de vacante');
      fetchVacancies();
      if(selectedVacancy && selectedVacancy.id === vacancyId) {
        setSelectedVacancy({...selectedVacancy, status: newStatus});
      }
    } catch(err) { alert(err.message) }
  };

  const handleDeleteVacancy = async (vacancyId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta vacante de forma permanente?")) return;
    try {
      const res = await fetch(`${API_URL}/api/vacancies/${vacancyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchVacancies();
      if (selectedVacancy && selectedVacancy.id === vacancyId) setSelectedVacancy(null);
    } catch(err) { alert(err.message) }
  };

  const handleRequestCv = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!requestCvForm.targetInstitutionId) return setError('Selecciona una institución válida.');

    try {
      const res = await fetch(`${API_URL}/api/tasks/request-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVacancyId: selectedVacancy.id,
          senderEmail: user.email,
          targetInstitutionId: requestCvForm.targetInstitutionId,
          description: requestCvForm.description || `Por favor buscamos candidatos para: ${selectedVacancy.role}`,
          dueDate: requestCvForm.dueDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar CV');
      
      setSuccess('¡Solicitud enviada a la institución!');
      setRequestCvForm({ targetInstitutionId: '', description: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateProgress = () => {
    let p = 0;
    if (form.role?.trim() !== '') p += 10;
    if (form.salary?.trim() !== '') p += 10;
    if (form.location?.trim() !== '') p += 10;
    if (form.activities?.trim() !== '') p += 20;
    if (form.skills?.trim() !== '') p += 20;
    if (form.modality?.trim() !== '') p += 10;
    if (form.language?.trim() !== '') p += 10;
    if (form.age?.trim() !== '') p += 5;
    if (form.gender?.trim() !== '') p += 5;
    return p > 100 ? 100 : p;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Red de Vacantes</h1>
          <p className="text-slate-500 dark:text-slate-400">Explora las posiciones abiertas en las instituciones asociadas.</p>
        </div>
        {(user?.role === 'universidad' || user?.role === 'management' || user?.role === 'admin') && (
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nueva Vacante
          </button>
        )}
      </div>

      {error && !showAddModal && !selectedVacancy && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}
      {success && !showAddModal && !selectedVacancy && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm mb-4 border border-emerald-200">{success}</div>}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((v) => (
            <div 
              key={v.id} 
              onClick={() => { setSelectedVacancy(v); setError(''); setSuccess(''); }}
              className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
                <select 
                  value={v.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); handleUpdateVacancyStatus(v.id, e.target.value); }}
                  className={`text-xs px-2 py-1 rounded-lg font-bold border outline-none cursor-pointer hover:opacity-80 transition-opacity ${v.status === 'Cerrada' ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : v.status === 'Pausada' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'}`}
                >
                  <option value="Abierta">Abierta</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{v.role}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 h-10">{v.activities}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold mb-4">
                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 px-3 py-1 rounded-xl"><Building className="w-4 h-4"/> {v.institutionName}</span>
                <span className="flex items-center gap-1.5 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 px-3 py-1 rounded-xl"><Briefcase className="w-4 h-4"/> {v.modality || 'Presencial'}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span>{v.cvCount} CVs vinculados</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vacancy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-10 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-panel" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold dark:text-white">Publicar Nueva Vacante</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            {error && showAddModal && <div className="m-6 mb-0 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}
            
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Completitud de la Vacante</span>
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${calculateProgress()}%` }}></div>
              </div>
            </div>

            <form onSubmit={handleAddVacancy} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Puesto Solicitado</label>
                  <input type="text" value={form.role} onChange={e=>setForm({...form, role: e.target.value})} required className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Rango Salarial</label>
                  <input type="text" value={form.salary} onChange={e=>setForm({...form, salary: e.target.value})} placeholder="Ej. $20,000 - $25,000 MXN" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Modalidad</label>
                  <select value={form.modality} onChange={e=>setForm({...form, modality: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrida">Híbrida</option>
                    <option value="Medio Tiempo">Medio Tiempo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Ubicación Geográfica</label>
                  <input type="text" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} placeholder="Ciudad, Estado..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Rango de Edad Recomendado</label>
                  <input type="text" value={form.age} onChange={e=>setForm({...form, age: e.target.value})} placeholder="Ej. 25 a 35 años" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Sexo Requerido</label>
                  <select value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                    <option value="Indistinto">Indistinto</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 mb-1">Habilidades Duras y Blandas</label>
                <textarea value={form.skills} onChange={e=>setForm({...form, skills: e.target.value})} rows="2" placeholder="Gestión de proyectos, Trabajo en equipo, Python..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Dominio de Idiomas</label>
                  <input type="text" value={form.language} onChange={e=>setForm({...form, language: e.target.value})} placeholder="Ej. Inglés B2" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Prueba de Conocimientos</label>
                  <input type="text" value={form.knowledgeTest} onChange={e=>setForm({...form, knowledgeTest: e.target.value})} placeholder="Sí (Examen Técnico), No, etc." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 mb-1">Descripción de Actividades</label>
                <textarea value={form.activities} onChange={e=>setForm({...form, activities: e.target.value})} rows="3" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none" required></textarea>
              </div>

              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                <input type="checkbox" id="confidentialCheck" checked={form.confidential} onChange={e=>setForm({...form, confidential: e.target.checked})} className="w-5 h-5 text-red-600 rounded bg-white border-slate-300 cursor-pointer" />
                <label htmlFor="confidentialCheck" className="text-sm font-bold text-red-700 dark:text-red-400 cursor-pointer select-none">Vacante Confidencial (Ocultar datos al exterior)</label>
              </div>

                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 mb-1">Institución que Publica</label>
                  <p className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-300 dark:border-slate-700 rounded-xl cursor-not-allowed">
                    {user?.institutionName || 'Tu institución (Asignación automática)'}
                  </p>
                </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all">
                Publicar Vacante
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Vacancy Detail Modal */}
      {selectedVacancy && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-10 animate-fade-in" onClick={() => setSelectedVacancy(null)}>
           {/* Stop propagation to avoid closing modal when clicking inside it */}
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start p-6 border-b border-slate-200 dark:border-slate-800 relative">
               <button onClick={() => setSelectedVacancy(null)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all z-10"><X className="w-5 h-5"/></button>
              <div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-3 inline-block">Inst. {selectedVacancy.institutionId}</span>
                <h2 className="text-2xl font-bold dark:text-white">{selectedVacancy.role}</h2>
                <div className="flex items-center text-sm text-slate-500 mt-2 gap-4">
                  <span className="flex items-center gap-1"><Building className="w-4 h-4"/> {selectedVacancy.institutionName}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {selectedVacancy.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {user?.role === 'admin' && (
                  <button onClick={() => handleDeleteVacancy(selectedVacancy.id)} className="text-sm px-3 py-1.5 rounded-lg font-bold border outline-none cursor-pointer transition-colors bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
                    Eliminar
                  </button>
                )}
                {user?.role !== 'user' && (
                  <select 
                    value={selectedVacancy.status}
                    onChange={(e) => handleUpdateVacancyStatus(selectedVacancy.id, e.target.value)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-bold border outline-none cursor-pointer hover:opacity-80 transition-opacity ${selectedVacancy.status === 'Cerrada' ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : selectedVacancy.status === 'Pausada' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'}`}
                  >
                    <option value="Abierta">Status: Abierta</option>
                    <option value="Pausada">Status: Pausada</option>
                    <option value="Cerrada">Status: Cerrada</option>
                  </select>
                )}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {error && selectedVacancy && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}
              {success && selectedVacancy && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-200">{success}</div>}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rango Salarial</h4>
                  <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-sm">{selectedVacancy.salary || 'No especificado'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modalidad</h4>
                  <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-sm font-medium">{selectedVacancy.modality || 'Presencial'}</p>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ubicación Geográfica</h4>
                  <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-sm">{selectedVacancy.location || 'Sin definir'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Edad ideal</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedVacancy.age || 'Indistinto'}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sexo</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedVacancy.gender || 'Indistinto'}</p>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Habilidades (Skills)</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedVacancy.skills || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Examen / Prueba Conocimientos</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedVacancy.knowledgeTest || 'No'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dominio de Idioma</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{selectedVacancy.language || 'No requerido'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider mb-2">Descripción de Actividades</h4>
                <div className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-line text-sm">
                  {selectedVacancy.activities || 'Sin actividades detalladas.'}
                </div>
              </div>
              
              {selectedVacancy.confidential && (
                <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800/50 text-sm font-bold text-center">
                  ⚠️ ESTA VACANTE ES CONFIDENCIAL / PROHIBIDO PUBLICARLA AL EXTERIOR
                </div>
              )}

              {/* CVS POSTULADOS - Restricted for user role */}
              {user?.role !== 'user' && (
                <>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden glass-panel">
                    <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Send className="w-5 h-5 text-indigo-500"/> Candidatos Postulados ({selectedVacancy.cvCount})</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-3">
                      {/* ACEPTADOS */}
                      {allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status === 'Aceptado').length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 border-b border-emerald-100 dark:border-emerald-900/50 pb-2">Talento Aceptado! 🎉</h4>
                          {allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status === 'Aceptado').map(cv => (
                            <div key={cv.id} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex flex-col gap-2 mb-2">
                              <div className="flex justify-between items-start">
                                <div className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                                  {cv.name}
                                  <select 
                                    value={cv.status || ''} 
                                    onChange={(e) => handleUpdateCvStatus(cv.id, e.target.value)}
                                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black outline-none border cursor-pointer hover:opacity-80 transition-opacity bg-emerald-100 text-emerald-700 border-emerald-200"
                                  >
                                    <option value="Aceptado">Aceptado</option>
                                    <option value="En Proceso">En trámite</option>
                                    <option value="Cartera">Cartera</option>
                                    <option value="Rechazado">Rechazado</option>
                                  </select>
                                </div>
                                <a href={`${API_URL}/uploads/${cv.document}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
                                  <FileText className="w-4 h-4"/> Ver CV
                                </a>
                              </div>
                              <div className="text-xs text-slate-500 font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                                <span>Inst. Origen: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{cv.sourceInstitutionName || cv.sourceInstitutionId || 'Directa'}</span></span>
                                <span className="text-slate-400">Publicado: {new Date(cv.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ACTIVOS */}
                      {allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status !== 'Aceptado').length === 0 && allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status === 'Aceptado').length === 0 ? (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">No hay candidatos postulados actualmente.</div>
                      ) : (
                      <div className="space-y-3">
                        {allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status !== 'Aceptado').length > 0 && <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 border-b border-slate-100 dark:border-slate-800 pb-2">Candidatos Activos</h4>}
                        {allCvs.filter(c => c.targetVacancyId === selectedVacancy.id && c.status !== 'Aceptado').map(cv => (
                          <div key={cv.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-400 transition-colors shadow-sm">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {cv.name}
                                <select 
                                  value={cv.status || ''} 
                                  onChange={(e) => handleUpdateCvStatus(cv.id, e.target.value)}
                                  className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black outline-none border cursor-pointer hover:opacity-80 transition-opacity ${cv.status === 'Aceptado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}
                                >
                                  <option value="En Proceso">En trámite</option>
                                  <option value="Aceptado">Aceptado</option>
                                  <option value="Cartera">Cartera</option>
                                  <option value="Rechazado">Rechazado</option>
                                </select>
                              </div>
                              <div className="text-xs text-slate-500 mt-2 flex flex-col sm:flex-row sm:items-center gap-2 font-medium">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-mono text-indigo-600 dark:text-indigo-400">Inst: {cv.sourceInstitutionName || cv.sourceInstitutionId || 'Directa'}</span>
                                <span className="text-slate-400">Publicado: {new Date(cv.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <a href={`${API_URL}/uploads/${cv.document}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-700 p-2 rounded-lg hover:bg-indigo-100 transition-colors ring-1 ring-inset ring-indigo-200">
                              <FileText className="w-5 h-5"/>
                            </a>
                          </div>
                        ))}
                      </div>
                      )}
                    </div>
                  </div>

                  {/* Enviar CV a Vacante */}
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6 pb-2">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Postular Candidato</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Sube el CV directamente a esta vacante para que la institución pueda revisarlo en su base de datos.</p>
                    </div>
                    
                    <form onSubmit={handleApplyCv} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nombre del Candidato</label>
                          <input type="text" value={applyForm.name} onChange={e=>setApplyForm({...applyForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Correo C.</label>
                          <input type="email" value={applyForm.email} onChange={e=>setApplyForm({...applyForm, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Archivo CV (PDF/Word)</label>
                        <input type="file" onChange={e=>setDocumentFile(e.target.files[0])} accept=".pdf,.doc,.docx" className="w-full px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 dark:text-white transition-colors cursor-pointer" required />
                      </div>
                      <button type="submit" disabled={!user?.institutionId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all">
                        {user?.institutionId ? 'Subir y Postular Candidato' : 'Bloqueado: Requiere Institución Aportadora'}
                      </button>
                    </form>
                  </div>

                  {/* Solicitar CV a Otra Institución */}
                  {selectedVacancy.institutionId === user?.institutionId && (
                    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6 pb-2">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Solicitar CV a Otra Institución</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pide directamente a una institución de la red que revise su base de datos y aporte CVs.</p>
                      </div>
                      
                      <form onSubmit={handleRequestCv} className="space-y-4 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Institución Destino</label>
                          <select 
                            value={requestCvForm.targetInstitutionId} 
                            onChange={e=>setRequestCvForm({...requestCvForm, targetInstitutionId: e.target.value})} 
                            className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">-- Selecciona Institución --</option>
                            {institutions.filter(i => i.id !== user?.institutionId).map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Acordar Fecha Límite (SLA)</label>
                          <input 
                            type="date" 
                            value={requestCvForm.dueDate} 
                            onChange={e=>setRequestCvForm({...requestCvForm, dueDate: e.target.value})} 
                            className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mensaje Opcional</label>
                          <textarea 
                            value={requestCvForm.description} 
                            onChange={e=>setRequestCvForm({...requestCvForm, description: e.target.value})} 
                            placeholder={`Ej. Estamos buscando perfiles para ${selectedVacancy.role}...`}
                            className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" 
                            rows="2"
                          ></textarea>
                        </div>
                        <button type="submit" disabled={!user?.institutionId} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-500/20 transition-all">
                          Enviar Solicitud
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

            </div>
           </div>
        </div>
      )}
      {/* Rejection Reasons Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowRejectionModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden glass-panel" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Claves de Rechazo</h3>
              <button onClick={() => setShowRejectionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleConfirmRejection} className="p-6 space-y-4">
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(REJECTION_CODES).map(([code, label]) => (
                  <label key={code} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                    <input 
                      type="radio" 
                      name="rejectionCode" 
                      value={code} 
                      checked={rejectionCode === code}
                      onChange={(e) => setrejectionCode(e.target.value)}
                      className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded-full" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-red-600 dark:text-red-400">Código {code}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>
                    </div>
                  </label>
                ))}
              </div>

              {rejectionCode === 'I' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Especifique motivo</label>
                  <textarea 
                    value={rejectionReasonCustom}
                    onChange={(e) => setRejectionReasonCustom(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm resize-none"
                    rows="3"
                    placeholder="Escriba aquí el motivo detallado..."
                    required
                  ></textarea>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  Confirmar Rechazo y Archivar
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-4 leading-normal">
                  Al confirmar, el perfil será movido a "Gestión de CVs" y se programará su eliminación automática en 30 días.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vacantes;
