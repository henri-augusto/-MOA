export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
  }

  return { url, publishableKey };
}

export const ARRANGEMENTS_BUCKET = "arrangements";
export const PREVIEWS_BUCKET = "previews";

export function publicPreviewUrl(workId: string) {
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/${PREVIEWS_BUCKET}/${workId}.jpg`;
}
