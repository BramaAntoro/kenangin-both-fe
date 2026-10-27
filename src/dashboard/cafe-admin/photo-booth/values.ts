import type { PhotoFilter } from "./types";

export const photoFilters: { id: PhotoFilter; label: string; css: string }[] = [
  { id: "natural", label: "Natural", css: "none" },
  { id: "warm", label: "Hangat", css: "sepia(0.28) saturate(1.15)" },
  { id: "mono", label: "Monokrom", css: "grayscale(1)" },
  { id: "bright", label: "Cerah", css: "brightness(1.12) saturate(1.2)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.42) contrast(0.92) saturate(0.82)" },
  { id: "cool", label: "Sejuk", css: "saturate(0.9) hue-rotate(12deg)" },
  { id: "soft", label: "Lembut", css: "brightness(1.06) contrast(0.88) saturate(0.9)" },
  { id: "pop", label: "Pop", css: "contrast(1.16) saturate(1.35)" },
  { id: "fade", label: "Pudar", css: "brightness(1.08) contrast(0.82) saturate(0.78)" },
  { id: "sunset", label: "Senja", css: "sepia(0.22) saturate(1.35) hue-rotate(-8deg)" },
];

export const emojiChoices = ["✨", "💛", "🎉", "🌼", "💖", "📸", "😎", "🥳"];

export const textColorChoices = [
  { label: "Midnight Plum", value: "#241435" },
  { label: "Sunset Orange", value: "#FF6B35" },
  { label: "Sunbeam Yellow", value: "#FFC845" },
  { label: "Sky Confetti", value: "#3FB6E0" },
  { label: "Warm Paper", value: "#FFF7F2" },
];
