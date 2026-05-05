import type { FigmaTemplate } from '../types';

const MOCK_TEMPLATES: Record<string, FigmaTemplate> = {
  hero: {
    imageUrl: 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=1200&h=630&fit=crop',
    width: 1200,
    height: 630,
    fetchedAt: new Date().toISOString(),
    textComponents: [
      {
        id: 'tc-hero-title',
        name: 'Hero Title',
        xPercent: 5,
        yPercent: 28,
        widthPercent: 55,
        fontSize: 48,
        color: '#ffffff',
        align: 'left',
        fontWeight: 'bold',
      },
      {
        id: 'tc-hero-subtitle',
        name: 'Hero Subtitle',
        xPercent: 5,
        yPercent: 52,
        widthPercent: 50,
        fontSize: 22,
        color: '#e2e8f0',
        align: 'left',
        fontWeight: 'normal',
      },
      {
        id: 'tc-hero-cta',
        name: 'CTA Button Label',
        xPercent: 5,
        yPercent: 70,
        widthPercent: 20,
        fontSize: 18,
        color: '#fbbf24',
        align: 'center',
        fontWeight: 'bold',
      },
    ],
  },
  feature: {
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    width: 1200,
    height: 630,
    fetchedAt: new Date().toISOString(),
    textComponents: [
      {
        id: 'tc-feature-heading',
        name: 'Feature Heading',
        xPercent: 50,
        yPercent: 20,
        widthPercent: 45,
        fontSize: 38,
        color: '#1e293b',
        align: 'left',
        fontWeight: 'bold',
      },
      {
        id: 'tc-feature-desc',
        name: 'Feature Description',
        xPercent: 50,
        yPercent: 42,
        widthPercent: 45,
        fontSize: 18,
        color: '#475569',
        align: 'left',
        fontWeight: 'normal',
      },
      {
        id: 'tc-feature-tag',
        name: 'Tag / Badge',
        xPercent: 50,
        yPercent: 72,
        widthPercent: 18,
        fontSize: 14,
        color: '#7c3aed',
        align: 'center',
        fontWeight: 'bold',
      },
    ],
  },
  social: {
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop',
    width: 1200,
    height: 630,
    fetchedAt: new Date().toISOString(),
    textComponents: [
      {
        id: 'tc-social-quote',
        name: 'Quote Text',
        xPercent: 8,
        yPercent: 25,
        widthPercent: 84,
        fontSize: 28,
        color: '#ffffff',
        align: 'center',
        fontWeight: 'normal',
      },
      {
        id: 'tc-social-author',
        name: 'Author Name',
        xPercent: 8,
        yPercent: 62,
        widthPercent: 84,
        fontSize: 18,
        color: '#fbbf24',
        align: 'center',
        fontWeight: 'bold',
      },
      {
        id: 'tc-social-role',
        name: 'Author Role',
        xPercent: 8,
        yPercent: 73,
        widthPercent: 84,
        fontSize: 15,
        color: '#cbd5e1',
        align: 'center',
        fontWeight: 'normal',
      },
    ],
  },
  promo: {
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=630&fit=crop',
    width: 1200,
    height: 630,
    fetchedAt: new Date().toISOString(),
    textComponents: [
      {
        id: 'tc-promo-label',
        name: 'Promo Label',
        xPercent: 5,
        yPercent: 15,
        widthPercent: 40,
        fontSize: 16,
        color: '#fbbf24',
        align: 'left',
        fontWeight: 'bold',
      },
      {
        id: 'tc-promo-title',
        name: 'Promo Title',
        xPercent: 5,
        yPercent: 30,
        widthPercent: 50,
        fontSize: 44,
        color: '#ffffff',
        align: 'left',
        fontWeight: 'bold',
      },
      {
        id: 'tc-promo-discount',
        name: 'Discount Value',
        xPercent: 5,
        yPercent: 58,
        widthPercent: 30,
        fontSize: 64,
        color: '#fbbf24',
        align: 'left',
        fontWeight: 'bold',
      },
      {
        id: 'tc-promo-disclaimer',
        name: 'Disclaimer',
        xPercent: 5,
        yPercent: 82,
        widthPercent: 50,
        fontSize: 13,
        color: '#94a3b8',
        align: 'left',
        fontWeight: 'normal',
      },
    ],
  },
};

function pickTemplate(url: string): FigmaTemplate {
  if (url.includes('hero') || url.includes('banner')) return { ...MOCK_TEMPLATES.hero, fetchedAt: new Date().toISOString() };
  if (url.includes('feature') || url.includes('card')) return { ...MOCK_TEMPLATES.feature, fetchedAt: new Date().toISOString() };
  if (url.includes('social') || url.includes('quote') || url.includes('testimonial')) return { ...MOCK_TEMPLATES.social, fetchedAt: new Date().toISOString() };
  if (url.includes('promo') || url.includes('sale') || url.includes('offer')) return { ...MOCK_TEMPLATES.promo, fetchedAt: new Date().toISOString() };
  const keys = Object.keys(MOCK_TEMPLATES) as (keyof typeof MOCK_TEMPLATES)[];
  const key = keys[url.length % keys.length];
  return { ...MOCK_TEMPLATES[key], fetchedAt: new Date().toISOString() };
}

export async function fetchFigmaTemplate(url: string): Promise<FigmaTemplate> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  if (!url.startsWith('http') && !url.startsWith('https://www.figma.com')) {
    throw new Error('Invalid Figma URL. Use a valid https://www.figma.com/... URL.');
  }
  return pickTemplate(url);
}

export const EXAMPLE_FIGMA_URLS = [
  'https://www.figma.com/file/abc123/hero-banner',
  'https://www.figma.com/file/def456/feature-card',
  'https://www.figma.com/file/ghi789/social-quote-testimonial',
  'https://www.figma.com/file/jkl012/promo-sale-offer',
];
