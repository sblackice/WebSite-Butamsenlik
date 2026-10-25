import { readFile } from "node:fs/promises";
import path from "node:path";
import { contentType, FILE_RE, UPLOAD_DIR, type UploadExt } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType(file.split(".").pop() as UploadExt),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
