export type PlateNode = {
  type?: string;
  text?: string;
  url?: string;
  src?: string;
  children?: PlateNode[];
  [key: string]: unknown;
};

const IMAGE_TYPES = new Set(["img", "image", "media", "mediaEmbed", "media-embed"]);

function getImageUrl(node: PlateNode): string | null {
  if (typeof node.url === "string" && node.url.trim()) {
    return node.url.trim();
  }
  if (typeof node.src === "string" && node.src.trim()) {
    return node.src.trim();
  }
  const data = node.data as { url?: string } | undefined;
  if (data?.url && data.url.trim()) {
    return data.url.trim();
  }
  return null;
}

function isImageNode(node: PlateNode): boolean {
  if (typeof node.type === "string" && IMAGE_TYPES.has(node.type)) {
    return true;
  }
  if (typeof node.type === "string" && node.type.includes("img")) {
    return true;
  }
  return Boolean(getImageUrl(node));
}

function nodeToText(node: PlateNode): string {
  if (typeof node.text === "string") {
    return node.text;
  }
  if (isImageNode(node)) {
    const url = getImageUrl(node);
    return url ? `[[img:${url}]]` : "";
  }
  if (Array.isArray(node.children)) {
    return node.children.map(nodeToText).join("");
  }
  return "";
}

export function serializePlateToText(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }
  const blocks = value
    .map((node) => nodeToText(node as PlateNode).trim())
    .filter(Boolean);
  return blocks.join("\n\n");
}

export function coerceContentToText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return content;
  }
  const looksLikeJson = trimmed.startsWith("[") || trimmed.startsWith("{");
  if (!looksLikeJson) {
    return content;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const serialized = serializePlateToText(parsed);
    return serialized || content;
  } catch {
    return content;
  }
}
