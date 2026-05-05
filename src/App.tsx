import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ImagesGenerationPage from './pages/ImagesGeneration';
import ImageEditor from './pages/ImagesGeneration/ImageEditor';
import LocalizationPage from './pages/Localization';
import { useStore } from './store/useStore';

export default function App() {
  const { loadAll, loaded } = useStore();

  useEffect(() => { loadAll(); }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/images" replace />} />
          <Route path="/images" element={<ImagesGenerationPage />} />
          <Route path="/images/:id" element={<ImageEditor />} />
          <Route path="/localization" element={<LocalizationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
