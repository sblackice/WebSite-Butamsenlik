import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./crypto";

// Local disk storage for admin uploads. Fine for a single server / VPS.
// On serverless hosting (e.g. Vercel) the disk is not persistent: use object storage
// (S3, Cloudflare R2, Vercel Blob) instead and keep the same saveUpload() signature.
export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "storage/uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const FILE_RE = /^[A-Za-z0-9_-]{16,64}\.(jpg|png|webp)$/;

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
export type UploadExt = keyof typeof TYPES;
export const contentType = (ext: UploadExt) => TYPES[ext];

/** Detect type from the file's first bytes, not from its name or the browser's claim. SVG is rejected on purpose. */
function sniff(buf: Buffer): UploadExt | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveUpload(file: File): Promise<{ url: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "Dosya seçilmedi." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Dosya 5 MB'tan büyük olamaz." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: "Yalnızca JPG, PNG veya WebP görsel yükleyebilirsiniz." };
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomToken(16)}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf, { flag: "wx" });
  return { url: `/media/${name}` };
}

export async function deleteUpload(url: string) {
  const name = url.startsWith("/media/") ? url.slice(7) : "";
  if (!FILE_RE.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
