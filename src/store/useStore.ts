import { create } from 'zustand';
import type { LocalizedText, LocalizedImage, FigmaTemplate, ImageTextValue } from '../types';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

interface StoreState {
  figmaToken: string;
  setFigmaToken: (token: string) => void;

  texts: LocalizedText[];
  images: LocalizedImage[];
  loaded: boolean;

  loadAll: () => Promise<void>;

  addText: (key: string, value: string) => Promise<LocalizedText>;
  updateText: (id: string, key: string, value: string) => Promise<void>;
  deleteText: (id: string) => Promise<void>;

  createImage: (name: string, figmaUrl: string) => Promise<LocalizedImage>;
  updateImageTemplate: (id: string, template: FigmaTemplate) => Promise<void>;
  updateImageTextValues: (id: string, textValues: ImageTextValue[]) => Promise<void>;
  updateImageName: (id: string, name: string) => Promise<void>;
  saveImage: (id: string) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>()((set, get) => ({
  figmaToken: (import.meta.env.VITE_FIGMA_TOKEN as string) || '',
  setFigmaToken: (token) => set({ figmaToken: token }),

  texts: [],
  images: [],
  loaded: false,

  loadAll: async () => {
    const [texts, images] = await Promise.all([
      api<LocalizedText[]>('/api/texts'),
      api<LocalizedImage[]>('/api/images'),
    ]);
    set({ texts, images, loaded: true });
  },

  addText: async (key, value) => {
    const text = await api<LocalizedText>('/api/texts', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    set((s) => ({ texts: [...s.texts, text] }));
    return text;
  },

  updateText: async (id, key, value) => {
    const updated = await api<LocalizedText>(`/api/texts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
    set((s) => ({ texts: s.texts.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteText: async (id) => {
    await api(`/api/texts/${id}`, { method: 'DELETE' });
    set((s) => ({ texts: s.texts.filter((t) => t.id !== id) }));
  },

  createImage: async (name, figmaUrl) => {
    const image = await api<LocalizedImage>('/api/images', {
      method: 'POST',
      body: JSON.stringify({ name, figmaUrl }),
    });
    set((s) => ({ images: [...s.images, image] }));
    return image;
  },

  updateImageTemplate: async (id, template) => {
    const existing = get().images.find((i) => i.id === id);
    const prevComponents = existing?.template?.textComponents ?? [];
    const prevValues = existing?.textValues ?? [];

    const textValues: ImageTextValue[] = template.textComponents.map((tc) => {
      const prev = prevValues.find((v) => v.componentId === tc.id);
      const wasThere = prevComponents.some((p) => p.id === tc.id);
      if (wasThere && prev) return prev;
      return { componentId: tc.id, localizationId: null, customText: '' };
    });

    const updated = await api<LocalizedImage>(`/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ template, textValues }),
    });
    set((s) => ({ images: s.images.map((img) => (img.id === id ? updated : img)) }));
  },

  updateImageTextValues: async (id, textValues) => {
    const updated = await api<LocalizedImage>(`/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ textValues }),
    });
    set((s) => ({ images: s.images.map((img) => (img.id === id ? updated : img)) }));
  },

  updateImageName: async (id, name) => {
    const updated = await api<LocalizedImage>(`/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    set((s) => ({ images: s.images.map((img) => (img.id === id ? updated : img)) }));
  },

  saveImage: async (id) => {
    const updated = await api<LocalizedImage>(`/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'saved' }),
    });
    set((s) => ({ images: s.images.map((img) => (img.id === id ? updated : img)) }));
  },

  deleteImage: async (id) => {
    await api(`/api/images/${id}`, { method: 'DELETE' });
    set((s) => ({ images: s.images.filter((img) => img.id !== id) }));
  },
}));
