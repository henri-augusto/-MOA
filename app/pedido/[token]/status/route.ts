import { NextResponse } from "next/server";
import { getOrderByAccessToken } from "@/lib/payments/orders";
import { reconcilePendingOrder } from "@/lib/payments/reconcile";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const loaded = await getOrderByAccessToken(token);
  if (!loaded) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  const order = await reconcilePendingOrder(loaded, sessionId);
  return NextResponse.json({ status: order.status });
}
