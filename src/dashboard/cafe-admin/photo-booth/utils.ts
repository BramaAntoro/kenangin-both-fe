import api from "../../../lib/client/axios";
import type {
  EmojiOverlay,
  FrameLayout,
  PhotoFilter,
  PhotoSlot,
  TextOverlay,
} from "./types";
import { photoFilters } from "./values";

export const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function assetUrl(url: string) {
  return url.startsWith("http")
    ? url
    : new URL(url, api.defaults.baseURL).toString();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto atau frame gagal dimuat."));
    image.src = src;
  });
}

export async function detectFramePhotoSlots(
  frameUrl: string,
  maxSlots: number,
): Promise<Omit<FrameLayout, "frameId">> {
  const frame = await loadImage(assetUrl(frameUrl));
  const scale = Math.min(
    1,
    500 / frame.naturalWidth,
    750 / frame.naturalHeight,
  );
  const width = Math.max(1, Math.round(frame.naturalWidth * scale));
  const height = Math.max(1, Math.round(frame.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Slot frame tidak dapat dibaca.");
  context.drawImage(frame, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const size = width * height;
  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  const minimumArea = size * 0.012;
  const maximumSlotAlpha = 250;
  const slots: PhotoSlot[] = [];

  for (let start = 0; start < size; start += 1) {
    if (visited[start] || data[start * 4 + 3]! >= maximumSlotAlpha) continue;
    let head = 0;
    let tail = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let touchesEdge = false;
    visited[start] = 1;
    queue[tail++] = start;

    while (head < tail) {
      const index = queue[head++]!;
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      touchesEdge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y < height - 1 ? index + width : -1,
      ];
      for (const neighbor of neighbors) {
        if (
          neighbor < 0 ||
          visited[neighbor] ||
          data[neighbor * 4 + 3]! >= maximumSlotAlpha
        )
          continue;
        visited[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }

    if (!touchesEdge && tail >= minimumArea) {
      slots.push({
        x: minX / width,
        y: minY / height,
        width: (maxX + 1 - minX) / width,
        height: (maxY + 1 - minY) / height,
      });
    }
  }

  slots.sort((a, b) => a.y - b.y || a.x - b.x);
  if (slots.length === 0)
    throw new Error(
      "Tidak ada slot foto yang terdeteksi. Pastikan area foto pada PNG transparan.",
    );
  return {
    aspectRatio: frame.naturalWidth / frame.naturalHeight,
    slots: slots.slice(0, maxSlots),
  };
}

export async function composeEditedPhoto(
  captures: string[],
  frameUrl: string,
  slots: PhotoSlot[],
  filter: PhotoFilter,
  emojiOverlays: EmojiOverlay[],
  text: TextOverlay,
): Promise<Blob> {
  const [photos, frame] = await Promise.all([
    Promise.all(captures.slice(0, slots.length).map(loadImage)),
    loadImage(assetUrl(frameUrl)),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = frame.naturalWidth;
  canvas.height = frame.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Editor foto tidak dapat dibuka.");

  context.fillStyle = "#FFF7F2";
  context.fillRect(0, 0, canvas.width, canvas.height);
  photos.forEach((photo, index) => {
    const slot = slots[index];
    if (!slot) return;
    const x = slot.x * canvas.width;
    const y = slot.y * canvas.height;
    const slotWidth = slot.width * canvas.width;
    const slotHeight = slot.height * canvas.height;
    const scale = Math.max(
      slotWidth / photo.naturalWidth,
      slotHeight / photo.naturalHeight,
    );
    const width = photo.naturalWidth * scale;
    const height = photo.naturalHeight * scale;
    context.save();
    context.beginPath();
    context.rect(x, y, slotWidth, slotHeight);
    context.clip();
    context.filter =
      photoFilters.find((item) => item.id === filter)?.css ?? "none";
    context.drawImage(
      photo,
      x + (slotWidth - width) / 2,
      y + (slotHeight - height) / 2,
      width,
      height,
    );
    context.restore();
  });
  context.drawImage(frame, 0, 0, canvas.width, canvas.height);

  for (const sticker of emojiOverlays) {
    context.save();
    context.translate(sticker.x * canvas.width, sticker.y * canvas.height);
    context.rotate((sticker.rotation * Math.PI) / 180);
    context.font = `${Math.round(canvas.width * 0.12 * sticker.size)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(sticker.value, 0, 0);
    context.restore();
  }
  if (text.value) {
    const fontSize = Math.round(canvas.width * 0.045 * text.size);
    const fontFamily =
      text.font === "fredoka" ? "Fredoka" : '"Plus Jakarta Sans"';
    await document.fonts.load(`600 ${fontSize}px ${fontFamily}`);
    context.font = `600 ${fontSize}px ${fontFamily}, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.save();
    context.translate(text.x * canvas.width, text.y * canvas.height);
    context.rotate((text.rotation * Math.PI) / 180);
    context.fillStyle = text.color;
    context.shadowColor = "rgba(36, 20, 53, 0.8)";
    context.shadowBlur = Math.max(2, fontSize * 0.16);
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 2;
    context.fillText(text.value, 0, 0, canvas.width * 0.85);
    context.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Hasil edit foto gagal dibuat."));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function readTerminalConfig() {
  return JSON.parse(
    localStorage.getItem("kenangin-photo-booth-config") ?? "{}",
  ) as { cafeId?: string; kioskId?: string };
}

export function loadMidtransSnap() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-midtrans-snap]",
    );
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Midtrans Snap gagal dimuat.")),
          { once: true },
        );
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.dataset.midtransSnap = "true";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Midtrans Snap gagal dimuat."));
    document.head.appendChild(script);
  });
}
