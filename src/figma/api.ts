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


function collectLocalizationNodes(node: FigmaNode, result: FigmaNode[] = []): FigmaNode[] {
  if (node.name.toLowerCase().includes('localization') && node.absoluteBoundingBox) {
    result.push(node);
  }
  // Keep traversing — localization nodes can be nested anywhere
  if (node.children) {
    for (const child of node.children) {
      collectLocalizationNodes(child, result);
    }
  }
  return result;
}

function fillColor(node: FigmaNode): string {
  // Use the rectangle's fill color to decide text color (invert luminance)
  const fill = node.fills?.find((f) => f.type === 'SOLID' && f.color);
  if (!fill?.color) return '#ffffff';
  const { r, g, b } = fill.color;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

function extractTextComponents(rootNode: FigmaNode): FigmaTextComponent[] {
  const frame = rootNode.absoluteBoundingBox;
  if (!frame) throw new Error('Root node has no bounding box.');

  const nodes = collectLocalizationNodes(rootNode);

  if (nodes.length === 0) {
    throw new Error(
      'No "localization" rectangles found in this frame. ' +
      'Add rectangle shapes in Figma and name them containing the word "localization".'
    );
  }

  return nodes.map((node) => {
    const box = node.absoluteBoundingBox!;
    const color = fillColor(node);
    // Font size ~55% of box height, capped so it looks natural
    const fontSize = Math.round(Math.min(box.height * 0.55, 72));

    return {
      id: node.id,
      name: node.name,
      xPercent: ((box.x - frame.x) / frame.width) * 100,
      yPercent: ((box.y - frame.y) / frame.height) * 100,
      widthPercent: (box.width / frame.width) * 100,
      heightPercent: (box.height / frame.height) * 100,
      fontSize,
      color,
      align: 'center',
      fontWeight: 'normal',
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
