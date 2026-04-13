import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Building, Users as UsersIcon, Shield, Plus, X } from 'lucide-react';

const Instituciones = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddInst, setShowAddInst] = useState(false);
  const [selectedInstUsers, setSelectedInstUsers] = useState(null);
  const [editingInst, setEditingInst] = useState(null); // Today's feature
  const [formInst, setFormInst] = useState({ _id: '', name: '', profile: 'Múltiple' });
  const [editForm, setEditForm] = useState({ titularName: '', titularMail: '', titularPhone: '', suplenteName: '', suplenteMail: '', suplentePhone: '' });
  const [logoFile, setLogoFile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resInst, resUsers] = await Promise.all([
        fetch('http://localhost:5000/api/institutions'),
        fetch('http://localhost:5000/api/users')
      ]);
      setInstitutions(await resInst.json());
      setUsers(await resUsers.json());
    } catch(e) { console.error(e) }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData() }, []);

  useEffect(() => { fetchData() }, []);

  const handleAddInstitution = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('_id', formInst._id);
      formData.append('name', formInst.name);
      formData.append('profile', formInst.profile);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await fetch('http://localhost:5000/api/institutions', {
        method: 'POST',
        body: formData
      });
      if(!res.ok) throw new Error('Error al registrar institución');

      setShowAddInst(false);
      setFormInst({ _id: '', name: '', profile: 'Múltiple' });
      setLogoFile(null);
      fetchData();
    } catch(err) { alert(err.message) }
  };

  const handleUpdateInstitution = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/institutions/${editingInst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if(!res.ok) throw new Error('Error al actualizar institución');
      setEditingInst(null);
      fetchData();
    } catch(err) { alert(err.message) }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch(err) { alert('Error actualizando usuario'); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Directorio de Entidades</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Instituciones registradas en nuestra red colaborativa.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mx-auto"></div></div>
      ) : (
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Institutions Card */}
          <div className="glass-panel p-8 rounded-3xl h-fit border-t-4 border-t-indigo-500 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Building className="text-indigo-500"/> Entidades Registradas</h2>
            <div className="space-y-4">
              {institutions.map(inst => (
                <div key={inst.id} className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3">
                      {inst.logo ? (
                        <img src={`http://localhost:5000/uploads/${inst.logo}`} alt={inst.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center rounded-xl text-indigo-500 font-bold border border-indigo-200 dark:border-indigo-800">
                          {inst.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{inst.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">Clave Interna: <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400"> {inst.id}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{inst.profile}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setEditingInst(inst);
                        setEditForm({
                          titularName: inst.titularName || '', titularMail: inst.titularMail || '', titularPhone: inst.titularPhone || '',
                          suplenteName: inst.suplenteName || '', suplenteMail: inst.suplenteMail || '', suplentePhone: inst.suplentePhone || ''
                        });
                      }} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold transition-all">
                        Editar Contactos
                      </button>
                      <button onClick={() => setSelectedInstUsers(inst)} className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer">
                        <UsersIcon className="w-3 h-3"/>
                        {users.filter(u => (u.institutionId?._id || u.institutionId) === inst.id).length} Usuarios
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {institutions.length === 0 && <p className="text-center text-slate-500 py-4">No hay instituciones registradas.</p>}
            </div>
          </div>


        </div>
      )}


      {/* EDIT INSTITUTION CONTACTS MODAL */}
      {editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={()=>setEditingInst(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-panel" onClick={e=>e.stopPropagation()}>
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <h2 className="text-xl font-bold dark:text-white">Contactos: {editingInst.name}</h2>
               <button type="button" onClick={() => setEditingInst(null)}><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleUpdateInstitution} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                    <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm italic">Titular Actual</h3>
                    <input type="text" value={editForm.titularName} onChange={e=>setEditForm({...editForm, titularName: e.target.value})} placeholder="Nombre Titular" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                    <input type="email" value={editForm.titularMail} onChange={e=>setEditForm({...editForm, titularMail: e.target.value})} placeholder="Email Titular" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                    <input type="text" value={editForm.titularPhone} onChange={e=>setEditForm({...editForm, titularPhone: e.target.value})} placeholder="Teléfono Titular" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-slate-600 dark:text-slate-400 text-sm italic">Suplente Oficial</h3>
                    <input type="text" value={editForm.suplenteName} onChange={e=>setEditForm({...editForm, suplenteName: e.target.value})} placeholder="Nombre Suplente" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                    <input type="email" value={editForm.suplenteMail} onChange={e=>setEditForm({...editForm, suplenteMail: e.target.value})} placeholder="Email Suplente" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                    <input type="text" value={editForm.suplentePhone} onChange={e=>setEditForm({...editForm, suplentePhone: e.target.value})} placeholder="Teléfono Suplente" className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg">Actualizar Datos de Contacto</button>
             </form>
          </div>
        </div>
      )}
      {selectedInstUsers && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-10 animate-fade-in" onClick={()=>setSelectedInstUsers(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-panel" onClick={e=>e.stopPropagation()}>
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 relative">
               <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><UsersIcon className="text-indigo-500"/> Usuarios en {selectedInstUsers.name}</h2>
               <button type="button" onClick={() => setSelectedInstUsers(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6 max-h-96 overflow-y-auto space-y-3">
                {users.filter(u => (u.institutionId?._id || u.institutionId) === selectedInstUsers.id).map(user => (
                  <div key={user._id || user.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center rounded-full text-indigo-600 dark:text-indigo-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">{user.name} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{user.role}</span></div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                ))}
                {users.filter(u => (u.institutionId?._id || u.institutionId) === selectedInstUsers.id).length === 0 && (
                  <div className="text-center py-6 text-slate-500">No hay usuarios registrados pertenecientes a esta institución.</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instituciones;
