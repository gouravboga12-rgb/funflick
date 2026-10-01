import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export const AdminCategoriesScreen = () => {
  const { showToast, theme } = useApp();
  const isLight = theme === 'light';

  const [categories, setCategories] = useState([
    { id: '1', name: 'Comedy', count: '18.4K clips', enabled: true },
    { id: '2', name: 'Entertainment', count: '14.2K clips', enabled: true },
    { id: '3', name: 'Stand-up', count: '8.9K clips', enabled: true },
    { id: '4', name: 'Memes', count: '12.1K clips', enabled: true },
    { id: '5', name: 'Dance', count: '6.4K clips', enabled: true },
    { id: '6', name: 'Music', count: '5.2K clips', enabled: true },
    { id: '7', name: 'Regional Comedy', count: '9.8K clips', enabled: true },
    { id: '8', name: 'Lifestyle', count: '4.1K clips', enabled: true },
  ]);

  const [newCatName, setNewCatName] = useState('');

  const toggleCategory = (id) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    const cat = categories.find(c => c.id === id);
    showToast(`"${cat?.name}" ${cat?.enabled ? 'disabled' : 'enabled'} successfully.`, 'info');
  };

  const deleteCategory = (id) => {
    const cat = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast(`Category "${cat?.name}" removed.`, 'error');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showToast('Please enter a category name.', 'error');
      return;
    }
    const alreadyExists = categories.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      showToast(`Category "${trimmed}" already exists.`, 'error');
      return;
    }
    setCategories(prev => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, count: '0 clips', enabled: true },
    ]);
    setNewCatName('');
    showToast(`✅ Category "${trimmed}" added to Discover navigation!`, 'success');
  };

  return (
    <AdminLayout title="Content Categories & Taxonomy">

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Categories', value: categories.length, color: 'text-purple-500' },
          { label: 'Active', value: categories.filter(c => c.enabled).length, color: 'text-emerald-500' },
          { label: 'Disabled', value: categories.filter(c => !c.enabled).length, color: 'text-rose-500' },
          { label: 'Total Clips', value: '78.9K', color: 'text-pink-500' },
        ].map(stat => (
          <div
            key={stat.label}
            className={`rounded-2xl p-4 border ${isLight ? 'bg-white border-slate-200' : 'bg-[#130d29] border-white/10'}`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              {stat.label}
            </p>
            <p className={`text-2xl font-extrabold font-heading mt-0.5 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Add New Category Form */}
      <div className={`rounded-3xl p-5 border ${isLight ? 'bg-white border-slate-200' : 'bg-[#130d29] border-white/10'}`}>
        <h3 className={`text-sm font-bold font-heading mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Add New Category
        </h3>
        <form onSubmit={handleAdd} className="flex gap-2.5">
          <div className="relative flex-1">
            <Tag className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="New Category Name (e.g. Roasts, Sketches)..."
              className={`w-full text-xs pl-10 pr-4 py-3 rounded-2xl border focus:outline-none focus:border-pink-500 transition ${
                isLight
                  ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200'
                  : 'bg-[#1b1434] text-white placeholder-gray-500 border-white/10'
              }`}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className={`text-sm font-bold font-heading mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          All Categories ({categories.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(c => (
            <div
              key={c.id}
              className={`p-4 rounded-3xl border transition group ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-pink-300 hover:shadow-md'
                  : 'bg-[#130d29] border-white/10 hover:border-pink-500/30'
              }`}
            >
              {/* Top row: name + delete */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className={`text-xs font-bold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {c.name}
                  </h4>
                  <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-gray-400'}`}>
                    {c.count}
                  </span>
                </div>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className={`opacity-0 group-hover:opacity-100 transition p-1 rounded-lg ${
                    isLight ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-gray-600 hover:text-rose-400 hover:bg-rose-500/10'
                  }`}
                  title="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => toggleCategory(c.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold transition ${
                  c.enabled
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : isLight
                      ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{c.enabled ? 'Enabled' : 'Disabled'}</span>
                {c.enabled
                  ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                  : <ToggleLeft className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

    </AdminLayout>
  );
};
