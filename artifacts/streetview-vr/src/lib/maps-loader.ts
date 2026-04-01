let loadPromise: Promise<void> | null = null;

export type MapsLoadError = "API_NOT_ACTIVATED" | "INVALID_KEY" | "UNKNOWN";

export class GoogleMapsLoadError extends Error {
  constructor(
    message: string,
    public readonly code: MapsLoadError
  ) {
    super(message);
    this.name = "GoogleMapsLoadError";
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const callbackName = "__googleMapsInit__";
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve();
    };

    const originalError = window.gm_authFailure;
    window.gm_authFailure = () => {
      const err = new GoogleMapsLoadError(
        "Google Maps API authentication failed. Make sure Maps JavaScript API is enabled.",
        "API_NOT_ACTIVATED"
      );
      loadPromise = null;
      reject(err);
      originalError?.();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      const err = new GoogleMapsLoadError("Failed to load Google Maps script.", "UNKNOWN");
      loadPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}
