import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Images, X, Check, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ImagesGenerationPage() {
  const navigate = useNavigate();
  const { images, deleteImage } = useStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleCreate() {
    navigate('/images/new');
  }

  function handleEdit(id: string) {
    navigate(`/images/${id}`);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <Images className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Image Generation</h1>
            <p className="text-sm text-gray-500">{images.length} image{images.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create new
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {images.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Images className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No localized images yet</p>
            <button
              onClick={handleCreate}
              className="mt-3 text-sm text-violet-600 hover:underline"
            >
              Create your first image
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Figma URL</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Updated</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {images.map((img, i) => (
                <tr
                  key={img.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === images.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
                      {img.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{img.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {img.figmaUrl ? (
                      <span className="font-mono">{img.figmaUrl}</span>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {img.status === 'saved' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Saved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(img.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleEdit(img.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      {deleteConfirm === img.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteImage(img.id); setDeleteConfirm(null); }}
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
                          onClick={() => setDeleteConfirm(img.id)}
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
    </div>
  );
}
