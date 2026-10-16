const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Extrai o id de 11 caracteres de um link do YouTube. String vazia → null (campo opcional). */
export function parseYoutubeVideoId(raw: string): { id: string | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { id: null };

  if (VIDEO_ID.test(trimmed)) return { id: trimmed };

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { id: null, error: "Cole um link do YouTube (watch, youtu.be, shorts ou embed)." };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
        id = parts[1] ?? null;
      }
    }
  }

  if (!id || !VIDEO_ID.test(id)) {
    return { id: null, error: "Cole um link do YouTube (watch, youtu.be, shorts ou embed)." };
  }

  return { id };
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
