export interface LatLng {
  lat: number;
  lng: number;
}

export interface PanoramaInfo {
  panoId: string;
  lat: number;
  lng: number;
  description?: string;
}

const RANDOM_LOCATIONS: LatLng[] = [
  { lat: 48.8566, lng: 2.3522 },
  { lat: 40.7128, lng: -74.006 },
  { lat: 51.5074, lng: -0.1278 },
  { lat: 35.6762, lng: 139.6503 },
  { lat: -33.8688, lng: 151.2093 },
  { lat: 55.7558, lng: 37.6173 },
  { lat: 52.52, lng: 13.405 },
  { lat: 41.9028, lng: 12.4964 },
  { lat: 19.4326, lng: -99.1332 },
  { lat: -22.9068, lng: -43.1729 },
  { lat: 1.3521, lng: 103.8198 },
  { lat: 37.7749, lng: -122.4194 },
  { lat: 25.2048, lng: 55.2708 },
  { lat: -34.6037, lng: -58.3816 },
  { lat: 59.3293, lng: 18.0686 },
  { lat: 45.4654, lng: 9.1859 },
  { lat: 50.8503, lng: 4.3517 },
  { lat: 47.3769, lng: 8.5417 },
  { lat: 39.9042, lng: 116.4074 },
  { lat: 28.6139, lng: 77.209 },
];

export function getRandomLocation(): LatLng {
  return RANDOM_LOCATIONS[Math.floor(Math.random() * RANDOM_LOCATIONS.length)];
}

export interface StreetViewMetadata {
  status: string;
  pano_id?: string;
  location?: {
    lat: number;
    lng: number;
    description?: string;
  };
}

export async function fetchPanoMetadata(location: LatLng): Promise<StreetViewMetadata | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&radius=500&source=outdoor&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function fetchPanoMetadataById(panoId: string): Promise<StreetViewMetadata | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?pano=${panoId}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export function findPanoramaViaJsApi(
  location: LatLng,
  radius: number = 500
): Promise<PanoramaInfo | null> {
  return new Promise((resolve) => {
    if (!window.google || !window.google.maps) {
      resolve(null);
      return;
    }
    const sv = new window.google.maps.StreetViewService();
    sv.getPanorama(
      {
        location: { lat: location.lat, lng: location.lng },
        radius,
        source: window.google.maps.StreetViewSource.OUTDOOR,
        preference: window.google.maps.StreetViewPreference.NEAREST,
      },
      (data, status) => {
        if (
          status === window.google.maps.StreetViewStatus.OK &&
          data?.location?.pano &&
          data?.location?.latLng
        ) {
          resolve({
            panoId: data.location.pano,
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
            description: data.location.description,
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

export async function findValidPanorama(): Promise<PanoramaInfo | null> {
  const shuffled = [...RANDOM_LOCATIONS].sort(() => Math.random() - 0.5);

  if (window.google && window.google.maps) {
    for (const loc of shuffled) {
      const result = await findPanoramaViaJsApi(loc);
      if (result) return result;
    }
    return null;
  }

  for (const loc of shuffled) {
    const meta = await fetchPanoMetadata(loc);
    if (meta && meta.status === "OK" && meta.pano_id && meta.location) {
      return {
        panoId: meta.pano_id,
        lat: meta.location.lat,
        lng: meta.location.lng,
        description: meta.location.description,
      };
    }
  }
  return null;
}
