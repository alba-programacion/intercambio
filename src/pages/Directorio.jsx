import React, { useEffect, useState } from 'react';
import { Book, Building, Phone, Mail, ShieldCheck, Search, Plus, X, UserPlus, Edit2 } from 'lucide-react';
import { useAuth } from '../App';

const Directorio = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    institutionName: '',
    titular: '',
    titularEmail: '',
    titularPhone: '',
    suplente: '',
    suplenteEmail: '',
    suplentePhone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchContacts = async () => {
    try {
      const res = await fetch('https://paleturquoise-stork-428174.hostingersite.com/api/contacts');
      const data = await res.json();
      setContacts(data);
    } catch(e) { console.error(e) }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const isEdit = !!form._id;
      const url = isEdit ? `https://paleturquoise-stork-428174.hostingersite.com/api/contacts/${form._id}` : 'https://paleturquoise-stork-428174.hostingersite.com/api/contacts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(isEdit ? 'Error al actualizar contacto' : 'Error al registrar contacto');
      
      setSuccess(isEdit ? '¡Contacto actualizado exitosamente!' : '¡Contacto agregado exitosamente!');
      setForm({ institutionName: '', titular: '', titularEmail: '', titularPhone: '', suplente: '', suplenteEmail: '', suplentePhone: '' });
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
        fetchContacts();
      }, 1500);
    } catch(err) { setError(err.message); }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este contacto del directorio? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`https://paleturquoise-stork-428174.hostingersite.com/api/contacts/${contactId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar contacto');
      fetchContacts();
    } catch(err) { alert(err.message) }
  };

  const filtered = contacts.filter(c => 
    c.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.titular.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header Premium Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/20 to-transparent blur-3xl rounded-full translate-x-1/2 -translate-y-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest">
              Red de Colaboración AMIB
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">Directorio de<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Contactos Institucionales</span></h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">Localiza rápidamente a los titulares y delegados suplentes del ecosistema.</p>
            
            {user?.role === 'admin' && (
              <button 
                onClick={() => { setForm({ institutionName: '', titular: '', titularEmail: '', titularPhone: '', suplente: '', suplenteEmail: '', suplentePhone: '' }); setShowAddModal(true); }}
                className="mt-4 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                <UserPlus className="w-5 h-5 text-indigo-600" /> Agregar Nuevo Contacto
              </button>
            )}
          </div>
          
          <div className="w-full md:w-96 relative group">
             <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-hover:text-indigo-400 transition-colors" />
             <input 
               type="text" 
               placeholder="Buscar institución o titular..." 
               value={searchTerm}
               onChange={(e)=>setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all font-bold placeholder-slate-500 backdrop-blur-md"
             />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Directorio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((c, idx) => (
            <div key={c._id || idx} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-[5rem] -mr-12 -mt-12 group-hover:scale-150 duration-700"></div>
              
              <div className="relative z-10 space-y-6">
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{c.institutionName}</h3>
                     <div className="flex gap-2">
                       {user?.role === 'admin' && (
                         <>
                           <button onClick={() => { setForm(c); setShowAddModal(true); }} className="text-slate-400 hover:text-indigo-500 transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-xl" title="Editar Contacto">
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDeleteContact(c._id)} className="text-red-400 hover:text-red-600 transition-colors p-2 bg-red-50 dark:bg-red-900/20 rounded-xl" title="Eliminar Contacto">
                              <X className="w-4 h-4 text-red-500" />
                           </button>
                         </>
                       )}
                     </div>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black uppercase tracking-widest text-indigo-600 inline-block">Entidad Registrada</div>
                </div>

                <div className="space-y-4">
                  {/* Titular Card */}
                  <div className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Titular</span>
                       <ShieldCheck className="w-4 h-4 text-indigo-500 opacity-50" />
                    </div>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200 mb-3">{c.titular}</p>
                    <div className="space-y-2">
                      <a href={`mailto:${c.titularEmail}`} className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400" /> {c.titularEmail}
                      </a>
                      <a href={`tel:${c.titularPhone}`} className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <Phone className="w-4 h-4 text-slate-400" /> {c.titularPhone}
                      </a>
                    </div>
                  </div>

                  {/* Suplente Card */}
                  <div className="p-5 rounded-[2rem] bg-indigo-500/5 border border-dashed border-indigo-500/20">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Delegado Suplente</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{c.suplente || 'Sin asignar'}</p>
                    {c.suplenteEmail && (
                      <div className="flex items-center gap-4 mt-2">
                        <a href={`mailto:${c.suplenteEmail}`} className="text-slate-400 hover:text-indigo-500 transition-colors"><Mail className="w-4 h-4" /></a>
                        {c.suplentePhone && <a href={`tel:${c.suplentePhone}`} className="text-slate-400 hover:text-indigo-500 transition-colors"><Phone className="w-4 h-4" /></a>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 text-center">
               <Book className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <h3 className="text-2xl font-black text-slate-900 dark:text-white">Directorio Vacío</h3>
               <p className="text-slate-500 font-medium">No hay contactos registrados aún en el sistema.</p>
            </div>
          )}
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-md p-4 pt-10 animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden glass-panel border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center relative">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{form._id ? 'Editar Contacto' : 'Registrar Nuevo Contacto'}</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{form._id ? 'Modifica los datos del directorio.' : 'Completa la ficha técnica institucional.'}</p>
                 </div>
                 <button onClick={() => { setShowAddModal(false); setForm({ institutionName: '', titular: '', titularEmail: '', titularPhone: '', suplente: '', suplenteEmail: '', suplentePhone: '' }); }} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm"><X className="w-6 h-6"/></button>
              </div>

              <form onSubmit={handleAddContact} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
                 {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100">{success}</div>}

                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre de la Institución</label>
                       <input type="text" value={form.institutionName} onChange={e => setForm({...form, institutionName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold dark:text-white" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                       <div className="space-y-4">
                          <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2">Datos del Titular</h4>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Completo</label>
                             <input type="text" value={form.titular} onChange={e => setForm({...form, titular: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" required />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Correo Electrónico</label>
                             <input type="email" value={form.titularEmail} onChange={e => setForm({...form, titularEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" required />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Teléfono Directo</label>
                             <input type="text" value={form.titularPhone} onChange={e => setForm({...form, titularPhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" required />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Datos del Suplente</h4>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Completo</label>
                             <input type="text" value={form.suplente} onChange={e => setForm({...form, suplente: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Correo Electrónico</label>
                             <input type="email" value={form.suplenteEmail} onChange={e => setForm({...form, suplenteEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Teléfono Directo</label>
                             <input type="text" value={form.suplentePhone} onChange={e => setForm({...form, suplentePhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6">
                    <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl transition-all hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-95 text-lg">
                       Guardar en Directorio
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Directorio;
