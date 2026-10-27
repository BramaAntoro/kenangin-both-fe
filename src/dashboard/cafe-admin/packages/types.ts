export type PackageFeatures = {
  timer_duration?: number;
  allow_filters?: boolean;
  retake_limit?: number;
  allow_emoji?: boolean;
  allow_custom_text?: boolean;
};

export type CafePackage = {
  id: string;
  cafeId: string;
  name: string;
  price: number;
  photoShotsCount: number;
  printCopiesCount: number;
  features: PackageFeatures | null;
  description: string | null;
  isActive: boolean | null;
};

export type Cafe = { id: string; name: string };

export type PackageForm = {
  cafeId: string;
  name: string;
  price: string;
  photoShotsCount: string;
  timerDuration: string;
  retakeLimit: string;
  allowFilters: boolean;
  allowEmoji: boolean;
  allowCustomText: boolean;
  printCopiesCount: string;
  description: string;
  isActive: boolean;
};
