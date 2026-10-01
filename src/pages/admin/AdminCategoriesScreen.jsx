import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { Plus, Tag, Edit3, Trash2, Check, X } from 'lucide-react';

export const AdminCategoriesScreen = () => {
  const { showToast } = useApp();
  const [categories, setCategories] = useState([
    { id: '1', name: 'Comedy', count: '18.4K clips', enabled: true },
    { id: '2', name: 'Entertainment', count: '14.2K clips', enabled: true },
    { id: '3', name: 'Stand-up', count: '8.9K clips', enabled: true },
    { id: '4', name: 'Memes', count: '12.1K clips', enabled: true },
    { id: '5', name: 'Dance', count: '6.4K clips', enabled: true },
    { id: '6', name: 'Music', count: '5.2K clips', enabled: true },
    { id: '7', name: 'Regional Comedy', count: '9.8K clips', enabled: true },
    { id: '8', name: 'Lifestyle', count: '4.1K clips', enabled: true }
  ]);

  const [newCatName, setNewCatName] = useState('');

  const toggleCategory = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    showToast('Category status updated.', 'info');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategories(prev => [
      ...prev,
      { id: Date.now().toString(), name: newCatName, count: '0 clips', enabled: true }
    ]);
    setNewCatName('');
    showToast('New category added to Discover navigation!', 'success');
  };

  return (
    <AdminLayout title="Content Categories & Taxonomy">
      {/* Add New Category */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="New Category Name (e.g. Roasts, Sketches)..."
          className="flex-1 bg-[#140e2b] text-white text-xs px-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map(c => (
          <div
            key={c.id}
            className="p-4 rounded-3xl bg-[#130d29] border border-white/10 flex items-center justify-between"
          >
            <div>
              <h4 className="text-xs font-bold text-white font-heading">{c.name}</h4>
              <span className="text-[10px] text-gray-400">{c.count}</span>
            </div>

            <button
              onClick={() => toggleCategory(c.id)}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold transition ${
                c.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-400'
              }`}
            >
              {c.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};
