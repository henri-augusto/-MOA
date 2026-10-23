import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREVIEW_PATH_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/preview\.jpg$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return new Response(null, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("published_preview_path", { p_id: id });
  const path = typeof data === "string" ? data : null;
  if (error || !path || !PREVIEW_PATH_PATTERN.test(path)) return new Response(null, { status: 404 });

  const { data: blob, error: downloadError } = await supabase.storage.from(ARRANGEMENTS_BUCKET).download(path);
  if (downloadError || !blob) return new Response(null, { status: 404 });

  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
