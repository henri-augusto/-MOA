export type Listing = {
  id: string;
  title: string;
  composer: string;
  arranger: string;
  formation: string;
  level: number;
  durationLabel: string;
  durationSeconds: number;
  parts: number;
  priceCents: number;
  description: string;
  previewVideoId: string | null;
  hasPreview: boolean;
};
