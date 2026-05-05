import type { FigmaTemplate, FigmaTextComponent } from '../types';

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: FigmaBoundingBox;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    fills?: Array<{ type: string; color?: FigmaColor; opacity?: number }>;
  };
  fills?: Array<{ type: string; color?: FigmaColor }>;
  characters?: string;
  children?: FigmaNode[];
}

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId: string;
}

export function parseFigmaUrl(url: string): ParsedFigmaUrl {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL. Please paste a valid Figma link.');
  }

  if (!parsed.hostname.includes('figma.com')) {
    throw new Error('URL must be from figma.com');
  }

  // Supports /file/ and /design/ paths
  const pathMatch = parsed.pathname.match(/\/(file|design)\/([^/]+)/);
  if (!pathMatch) {
    throw new Error('Could not extract file key from URL. Make sure it\'s a Figma file or design URL.');
  }
  const fileKey = pathMatch[2];

  const rawNodeId = parsed.searchParams.get('node-id');
  if (!rawNodeId) {
    throw new Error('No node-id found in URL. Right-click a frame or component in Figma → "Copy link" to get the correct URL.');
  }

  // Normalize: Figma uses both "1-2" and "1:2" formats
  const nodeId = rawNodeId.replace(/-/g, ':');

  return { fileKey, nodeId };
}

function colorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function collectTextNodes(node: FigmaNode, result: FigmaNode[] = []): FigmaNode[] {
  if (node.type === 'TEXT') {
    result.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      collectTextNodes(child, result);
    }
  }
  return result;
}

function extractTextComponents(rootNode: FigmaNode): FigmaTextComponent[] {
  const frame = rootNode.absoluteBoundingBox;
  if (!frame) throw new Error('Root node has no bounding box.');

  const textNodes = collectTextNodes(rootNode);

  return textNodes.map((node) => {
    const box = node.absoluteBoundingBox ?? { x: frame.x, y: frame.y, width: 200, height: 40 };
    const style = node.style ?? {};
    const fill = style.fills?.find((f) => f.type === 'SOLID' && f.color);
    const color = fill?.color ? colorToHex(fill.color) : '#000000';

    const align = style.textAlignHorizontal ?? 'LEFT';
    const alignMap: Record<string, 'left' | 'center' | 'right'> = {
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      JUSTIFIED: 'left',
    };

    return {
      id: node.id,
      name: node.name,
      xPercent: ((box.x - frame.x) / frame.width) * 100,
      yPercent: ((box.y - frame.y) / frame.height) * 100,
      widthPercent: (box.width / frame.width) * 100,
      fontSize: style.fontSize ?? 16,
      color,
      align: alignMap[align] ?? 'left',
      fontWeight: (style.fontWeight ?? 400) >= 600 ? 'bold' : 'normal',
    };
  });
}

async function figmaGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': token },
  });
  if (res.status === 403) throw new Error('Invalid Figma token. Check your personal access token.');
  if (res.status === 404) throw new Error('Figma file or node not found. Make sure the URL is correct and you have access.');
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchFigmaTemplate(url: string, token: string): Promise<FigmaTemplate> {
  const { fileKey, nodeId } = parseFigmaUrl(url);

  // Fetch node tree and rendered image in parallel
  const encodedNodeId = encodeURIComponent(nodeId);

  const [nodeData, imageData] = await Promise.all([
    figmaGet<{ nodes: Record<string, { document: FigmaNode }> }>(
      `/files/${fileKey}/nodes?ids=${encodedNodeId}`,
      token,
    ),
    figmaGet<{ images: Record<string, string> }>(
      `/images/${fileKey}?ids=${encodedNodeId}&format=png&scale=2`,
      token,
    ),
  ]);

  const nodeEntry = nodeData.nodes[nodeId];
  if (!nodeEntry) {
    throw new Error('Node not found in Figma response. Make sure the node-id in the URL is correct.');
  }
  const rootNode = nodeEntry.document;
  const frame = rootNode.absoluteBoundingBox;
  if (!frame) throw new Error('Selected node has no dimensions.');

  const imageUrl = imageData.images[nodeId];
  if (!imageUrl) throw new Error('Figma could not render this node as an image.');

  const textComponents = extractTextComponents(rootNode);

  return {
    imageUrl,
    width: frame.width,
    height: frame.height,
    textComponents,
    fetchedAt: new Date().toISOString(),
  };
}
