function getEnv(key: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing required environment variable : ${key}`);
  }

  return value;
}


export const apiBaseUrl = getEnv("PUBLIC_API_BASE_URL");
