import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ImagesGenerationPage from './pages/ImagesGeneration';
import ImageEditor from './pages/ImagesGeneration/ImageEditor';
import LocalizationPage from './pages/Localization';

export default function App() {
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
