import { FILE_NAMES } from "@/lib/arranger/work-form";
import { getOrderByAccessToken, getOrderWorkFiles } from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

/** Pasta da obra no bucket. A chave de serviço ignora o RLS, então o caminho gravado não pode sair daqui. */
function ownedFilePath(arrangerId: string, workId: string, kind: "grade" | "partes") {
  const fileName = kind === "grade" ? FILE_NAMES.score : FILE_NAMES.parts;
  return `${arrangerId}/${workId}/${fileName}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; kind: string }> },
) {
  const { token, kind } = await params;
  if (!TOKEN_PATTERN.test(token) || (kind !== "grade" && kind !== "partes")) {
    return new Response(null, { status: 404 });
  }

  const order = await getOrderByAccessToken(token);
  if (!order || order.status !== "paid") {
    return new Response(null, { status: 404 });
  }

  const work = await getOrderWorkFiles(order.work_id);
  const path = kind === "grade" ? work?.score_path : work?.parts_path;
  if (!path || path !== ownedFilePath(order.arranger_id, order.work_id, kind)) {
    return new Response(null, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data: blob, error } = await supabase.storage.from(ARRANGEMENTS_BUCKET).download(path);
  if (error || !blob) return new Response(null, { status: 404 });

  const filename = kind === "grade" ? "grade.pdf" : "partes.pdf";
  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
