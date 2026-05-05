import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Languages, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { LocalizedText } from '../../types';

interface ModalState {
  open: boolean;
  editing: LocalizedText | null;
}

export default function LocalizationPage() {
  const { texts, addText, updateText, deleteText } = useStore();
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null });
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setKey('');
    setValue('');
    setModal({ open: true, editing: null });
  }

  function openEdit(t: LocalizedText) {
    setKey(t.key);
    setValue(t.value);
    setModal({ open: true, editing: t });
  }

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  async function handleSave() {
    if (!key.trim() || !value.trim()) return;
    setSaving(true);
    try {
      if (modal.editing) {
        await updateText(modal.editing.id, key.trim(), value.trim());
      } else {
        await addText(key.trim(), value.trim());
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  const filtered = texts.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.value.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <Languages className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Localization</h1>
            <p className="text-sm text-gray-500">{texts.length} text{texts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create new
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by ID, key or text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Languages className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search ? 'No results found' : 'No localized texts yet'}</p>
            {!search && (
              <button
                onClick={openCreate}
                className="mt-3 text-sm text-violet-600 hover:underline"
              >
                Create your first text
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Key</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Created</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
                      {t.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.key}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.value}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === t.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteText(t.id).then(() => setDeleteConfirm(null)); }}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(t.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {modal.editing ? 'Edit text' : 'New localized text'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {modal.editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ID</label>
                  <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded">
                    {modal.editing.id}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. hero_title, cta_button_label"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter the localized text…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !key.trim() || !value.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {modal.editing ? 'Save changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
