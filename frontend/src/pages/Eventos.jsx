import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Upload, Edit, Text, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';
import { API_URL } from '../config';

const Eventos = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('comites'); // 'comites' | 'feria'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Feria del Libro States
  const [feriaData, setFeriaData] = useState({ description: '', image: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Committee manual reminder state
  const [sendingReminder, setSendingReminder] = useState(false);

  // Dynamically calculate committees: first Tuesday of each month for the next 12 months
  const getUpcomingCommittees = () => {
    const dates = [];
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth(); // 0-indexed

    for (let i = 0; i < 12; i++) {
      // Get first day of currentMonth
      let date = new Date(currentYear, currentMonth, 1);
      while (date.getDay() !== 2) { // 2 = Tuesday
        date.setDate(date.getDate() + 1);
      }
      
      // Calculate Monday before (Reminder Day)
      const reminderDate = new Date(date);
      reminderDate.setDate(reminderDate.getDate() - 1);

      dates.push({
        date: new Date(date),
        reminderDate: new Date(reminderDate),
        monthName: date.toLocaleString('es-ES', { month: 'long' }),
        year: date.getFullYear()
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return dates;
  };

  const committees = getUpcomingCommittees();
  const nextCommittee = committees[0];

  // Fetch Feria del Libro data from API
  const fetchFeriaDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/Feria del Libro`);
      if (res.ok) {
        const data = await res.json();
        setFeriaData({
          description: data.description || '',
          image: data.image ? `${API_URL}/uploads/${data.image}` : ''
        });
        setEditDescription(data.description || '');
      }
    } catch (err) {
      console.error('Error fetching Book Fair details:', err);
    }
  };

  useEffect(() => {
    fetchFeriaDetails();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveFeria = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('description', editDescription);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await fetch(`${API_URL}/api/events/Feria del Libro`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setFeriaData({
          description: data.description || '',
          image: data.image ? `${API_URL}/uploads/${data.image}?t=${Date.now()}` : ''
        });
        setSuccess('Evento actualizado exitosamente.');
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl('');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar el evento.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendManualReminder = async () => {
    setSendingReminder(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/events/comite/reminder`, {
        method: 'POST'
      });
      if (res.ok) {
        setSuccess('Recordatorio manual de comité enviado exitosamente por correo a todos los usuarios.');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al enviar el recordatorio manual.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al comunicarse con el servidor.');
    } finally {
      setSendingReminder(false);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'management';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Eventos</h1>
          <p className="text-slate-500 dark:text-slate-400">Consulta y edita eventos de la plataforma</p>
        </div>
        
        {/* Navigation Tabs (Underline design) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 w-full md:w-auto self-start md:self-center">
          <button
            onClick={() => setActiveTab('comites')}
            className={`px-6 py-3 text-sm font-bold transition-all relative ${
              activeTab === 'comites'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Comités
            {activeTab === 'comites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-fade-in" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('feria')}
            className={`px-6 py-3 text-sm font-bold transition-all relative ${
              activeTab === 'feria'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Feria del Libro
            {activeTab === 'feria' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-fade-in" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'comites' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card (Next Committee) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 space-y-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Siguiente Reunión</span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white capitalize">
                  {nextCommittee.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">Dirección</h4>
                  <p className="text-slate-600 dark:text-slate-400">Av. paseo de la república #255, P1</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">Notificaciones Automáticas</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Se enviará una alerta por correo a todos los usuarios el **lunes previo** a la sesión (el{' '}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {nextCommittee.reminderDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </span>
                    ).
                  </p>
                  
                  {user?.role === 'admin' && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleSendManualReminder}
                        disabled={sendingReminder}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
                      >
                        {sendingReminder ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Enviando Recordatorio...
                          </>
                        ) : (
                          'Enviar Recordatorio Manual por Correo'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive location map visualization */}
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-48 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 group-hover:opacity-80 transition-opacity"></div>
              <div className="text-center p-4 relative z-10 space-y-2">
                <MapPin className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
                <p className="font-bold text-slate-800 dark:text-white text-sm">Av. paseo de la república #255, P1</p>
                <p className="text-xs text-slate-400">Edificio Corporativo AMIB</p>
              </div>
            </div>
          </div>

          {/* Calendar List Sidebar */}
          <div className="glass-panel p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 space-y-6 shadow-xl">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Programación Anual</h3>
              <p className="text-xs text-slate-400">Primer martes de cada mes</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              {committees.map((c, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    idx === 0
                      ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white capitalize">
                      {c.monthName} {c.year}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Sesión: {c.date.toLocaleDateString('es-ES', { day: 'numeric' })} de {c.monthName}
                    </p>
                  </div>
                  {idx === 0 && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Próximo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feria' && (
        <div className="max-w-3xl mx-auto">
          {/* Notification Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-4 border border-red-200 dark:border-red-800/50 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm mb-4 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
              <Check className="w-5 h-5" /> {success}
            </div>
          )}

          {isEditing && canEdit ? (
            /* Editing Form */
            <form onSubmit={handleSaveFeria} className="glass-panel p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 space-y-6 shadow-xl">
              <h3 className="font-black text-xl text-slate-800 dark:text-white">{(!feriaData.description && !feriaData.image) ? 'Agregar Evento de Feria del Libro' : 'Editar Feria del Libro'}</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350">Descripción de qué trata el evento</label>
                <textarea
                  rows="6"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white text-sm"
                  placeholder="Explica detalladamente de qué trata el evento de la Feria del Libro..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350">Imagen de Portada</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-350">Selecciona o arrastra una imagen</p>
                  <p className="text-xs text-slate-400">PNG, JPG o GIF hasta 5MB</p>
                </div>
              </div>

              {/* Upload Preview */}
              {(previewUrl || feriaData.image) && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Previsualización de Imagen</span>
                  <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img
                      src={previewUrl || feriaData.image}
                      alt="Event Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setEditDescription(feriaData.description);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 text-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          ) : (
            /* View Details */
            <div className="glass-panel p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 space-y-6 shadow-xl">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Feria del Libro</span>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Feria de Lectura TalentCollab</h2>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm flex items-center gap-2 text-sm font-bold"
                  >
                    <Edit className="w-4 h-4" /> {(!feriaData.description && !feriaData.image) ? 'Agregar Evento' : 'Editar Evento'}
                  </button>
                )}
              </div>

              {feriaData.image ? (
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                  <img
                    src={feriaData.image}
                    alt="Feria del Libro"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <CalendarIcon className="w-10 h-10 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-bold text-slate-500">Sin Imagen del Evento</p>
                  <p className="text-xs text-slate-400">Edita el evento para subir una portada</p>
                </div>
              )}

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-6 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Text className="w-4 h-4 text-indigo-500" /> Acerca del evento
                </h4>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed text-sm">
                  {feriaData.description || 'No hay descripción disponible para este evento todavía.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Eventos;
