import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalizedText, LocalizedImage, FigmaTemplate, ImageTextValue } from '../types';

let textIdCounter = 1;
let imageIdCounter = 1;

function genTextId(): string {
  return `TXT-${String(textIdCounter++).padStart(4, '0')}`;
}

function genImageId(): string {
  return `IMG-${String(imageIdCounter++).padStart(4, '0')}`;
}

function now(): string {
  return new Date().toISOString();
}

interface StoreState {
  figmaToken: string;
  setFigmaToken: (token: string) => void;

  texts: LocalizedText[];
  images: LocalizedImage[];

  addText: (key: string, value: string) => LocalizedText;
  updateText: (id: string, key: string, value: string) => void;
  deleteText: (id: string) => void;

  createImage: (name: string, figmaUrl: string) => LocalizedImage;
  updateImageTemplate: (id: string, template: FigmaTemplate) => void;
  updateImageTextValues: (id: string, textValues: ImageTextValue[]) => void;
  updateImageName: (id: string, name: string) => void;
  saveImage: (id: string) => void;
  deleteImage: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      figmaToken: (import.meta.env.VITE_FIGMA_TOKEN as string) || '',
      setFigmaToken: (token) => set({ figmaToken: token }),

      texts: [],
      images: [],

      addText: (key, value) => {
        const entry: LocalizedText = { id: genTextId(), key, value, createdAt: now() };
        set((s) => ({ texts: [...s.texts, entry] }));
        return entry;
      },

      updateText: (id, key, value) => {
        set((s) => ({
          texts: s.texts.map((t) => (t.id === id ? { ...t, key, value } : t)),
        }));
      },

      deleteText: (id) => {
        set((s) => ({ texts: s.texts.filter((t) => t.id !== id) }));
      },

      createImage: (name, figmaUrl) => {
        const img: LocalizedImage = {
          id: genImageId(),
          name,
          figmaUrl,
          template: null,
          textValues: [],
          status: 'draft',
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ images: [...s.images, img] }));
        return img;
      },

      updateImageTemplate: (id, template) => {
        const existing = get().images.find((i) => i.id === id);
        const prevComponents = existing?.template?.textComponents ?? [];
        const newComponents = template.textComponents;
        const prevValues = existing?.textValues ?? [];

        const textValues: ImageTextValue[] = newComponents.map((tc) => {
          const prev = prevValues.find((v) => v.componentId === tc.id);
          const wasThere = prevComponents.some((p) => p.id === tc.id);
          if (wasThere && prev) return prev;
          return { componentId: tc.id, localizationId: null, customText: '' };
        });

        set((s) => ({
          images: s.images.map((img) =>
            img.id === id ? { ...img, template, textValues, updatedAt: now() } : img,
          ),
        }));
      },

      updateImageTextValues: (id, textValues) => {
        set((s) => ({
          images: s.images.map((img) =>
            img.id === id ? { ...img, textValues, updatedAt: now() } : img,
          ),
        }));
      },

      updateImageName: (id, name) => {
        set((s) => ({
          images: s.images.map((img) =>
            img.id === id ? { ...img, name, updatedAt: now() } : img,
          ),
        }));
      },

      saveImage: (id) => {
        set((s) => ({
          images: s.images.map((img) =>
            img.id === id ? { ...img, status: 'saved', updatedAt: now() } : img,
          ),
        }));
      },

      deleteImage: (id) => {
        set((s) => ({ images: s.images.filter((img) => img.id !== id) }));
      },
    }),
    {
      name: 'localized-images-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          textIdCounter = state.texts.length + 1;
          imageIdCounter = state.images.length + 1;
          // If localStorage had no token, seed from env var
          if (!state.figmaToken && import.meta.env.VITE_FIGMA_TOKEN) {
            state.figmaToken = import.meta.env.VITE_FIGMA_TOKEN as string;
          }
        }
      },
    },
  ),
);
