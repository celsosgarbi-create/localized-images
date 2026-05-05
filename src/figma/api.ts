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
  absoluteRenderBounds?: FigmaBoundingBox;
  size?: { x: number; y: number };
  relativeTransform?: [[number, number, number], [number, number, number]];
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


function resolveBbox(node: FigmaNode, parentBbox?: FigmaBoundingBox): FigmaBoundingBox | undefined {
  if (node.absoluteBoundingBox) return node.absoluteBoundingBox;
  if (node.absoluteRenderBounds) return node.absoluteRenderBounds;
  // Compute from relativeTransform + size when parent bbox is known
  if (node.size && node.relativeTransform && parentBbox) {
    return {
      x: parentBbox.x + node.relativeTransform[0][2],
      y: parentBbox.y + node.relativeTransform[1][2],
      width: node.size.x,
      height: node.size.y,
    };
  }
  return undefined;
}

function collectLocalizationNodes(
  node: FigmaNode,
  result: FigmaNode[] = [],
  parentBbox?: FigmaBoundingBox,
): FigmaNode[] {
  const bbox = resolveBbox(node, parentBbox);
  if (node.name.toLowerCase().includes('localization')) {
    // Attach resolved bbox so extractTextComponents can use it
    if (bbox && !node.absoluteBoundingBox) node.absoluteBoundingBox = bbox;
    result.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      collectLocalizationNodes(child, result, bbox ?? parentBbox);
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

  console.log('[Figma] root node:', rootNode.id, rootNode.name, rootNode.type);
  console.log('[Figma] root children count:', rootNode.children?.length ?? 0);
  // Full dump — expand in DevTools to inspect
  console.log('[Figma] root children (raw):', rootNode.children);
  console.log('[Figma] localization nodes found:', nodes.length, nodes.map((n) => `${n.name} | type=${n.type} | bbox=${JSON.stringify(n.absoluteBoundingBox)}`));

  // Filter to nodes that have a usable bounding box
  const usable = nodes.filter((n) => n.absoluteBoundingBox);

  if (usable.length === 0 && nodes.length > 0) {
    throw new Error(
      `Found ${nodes.length} "localization" rectangle(s) but none had position data (absoluteBoundingBox missing). ` +
      'This can happen with deeply nested components. Try flattening the localization rectangles to be direct children of the frame.',
    );
  }

  if (usable.length === 0) {
    throw new Error(
      'No "localization" rectangles found in this frame. ' +
      'Add rectangle shapes in Figma and name them containing the word "localization".',
    );
  }

  return usable.map((node) => {
    const box = node.absoluteBoundingBox!;
    const color = fillColor(node);
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

  console.log('[Figma] fetching nodeId:', nodeId, 'fileKey:', fileKey);

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

  console.log('[Figma] nodes response keys:', Object.keys(nodeData.nodes));
  console.log('[Figma] requested nodeId:', nodeId);
  const nodeEntry = nodeData.nodes[nodeId];
  if (!nodeEntry) {
    // Try alternative key formats (Figma sometimes uses hyphen vs colon)
    const altKey = Object.keys(nodeData.nodes)[0];
    if (!altKey) throw new Error('Node not found in Figma response. Make sure the node-id in the URL is correct.');
    console.warn('[Figma] nodeId not found directly, falling back to first key:', altKey);
    const fallbackEntry = nodeData.nodes[altKey];
    const fallbackRoot = fallbackEntry.document;
    const fallbackFrame = fallbackRoot.absoluteBoundingBox;
    if (!fallbackFrame) throw new Error('Selected node has no dimensions.');
    const fallbackImageUrl = imageData.images[altKey] ?? imageData.images[nodeId];
    if (!fallbackImageUrl) throw new Error('Figma could not render this node as an image.');
    const textComponents = extractTextComponents(fallbackRoot);
    return { imageUrl: fallbackImageUrl, width: fallbackFrame.width, height: fallbackFrame.height, textComponents, fetchedAt: new Date().toISOString() };
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
