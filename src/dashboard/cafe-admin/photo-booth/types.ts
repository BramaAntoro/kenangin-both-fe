export type BoothPackage = {
  id: string;
  name: string;
  price: number;
  photoShotsCount: number;
  printCopiesCount: number;
  features: {
    timer_duration?: number;
    allow_filters?: boolean;
    retake_limit?: number;
    allow_emoji?: boolean;
    allow_custom_text?: boolean;
  } | null;
};

export type CafeKiosk = { id: string; name: string };
export type Frame = { id: string; title: string; frameUrl: string; maxPhotosSlot: number };
export type FrameLayout = {
  frameId: string;
  aspectRatio: number;
  slots: PhotoSlot[];
};
export type PhotoSlot = { x: number; y: number; width: number; height: number };
export type PhotoFilter =
  | "natural"
  | "warm"
  | "mono"
  | "bright"
  | "vintage"
  | "cool"
  | "soft"
  | "pop"
  | "fade"
  | "sunset";
export type EmojiOverlay = {
  id: string;
  value: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};
export type TextOverlay = {
  value: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  font: "fredoka" | "jakarta";
};
export type DragOverlay = { type: "emoji" | "text"; id: string };
export type Step = "packages" | "frame" | "capture" | "edit" | "complete";
