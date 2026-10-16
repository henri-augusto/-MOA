import { youtubeEmbedUrl } from "@/lib/arranger/youtube";

type YoutubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function YoutubeEmbed({ videoId, title, className = "" }: YoutubeEmbedProps) {
  return (
    <div className={`overflow-hidden rounded-sm border border-staff bg-charcoal shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)] ${className}`}>
      <div className="relative aspect-video w-full">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={`Vídeo: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
