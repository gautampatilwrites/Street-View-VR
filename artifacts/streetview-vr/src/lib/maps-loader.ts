let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __googleMapsInit__?: () => void;
  }
}

export class GoogleMapsLoadError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "GoogleMapsLoadError";
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.StreetViewPanorama) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    window.__googleMapsInit__ = () => resolve();

    window.gm_authFailure = () => {
      loadPromise = null;
      reject(new GoogleMapsLoadError(
        "Google Maps authentication failed. Check your API key.",
        "API_NOT_ACTIVATED"
      ));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsInit__`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new GoogleMapsLoadError("Failed to load Google Maps script.", "UNKNOWN"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
