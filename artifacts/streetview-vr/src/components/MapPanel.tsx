import { useEffect, useRef, useState, useCallback } from "react";
import { PanoramaInfo, fetchPanoMetadata } from "@/lib/streetview";
import { loadGoogleMaps } from "@/lib/maps-loader";

interface MapPanelProps {
  visible: boolean;
  currentLocation: { lat: number; lng: number } | null;
  onLocationSelect: (info: PanoramaInfo) => void;
  onClose: () => void;
}

export function MapPanel({ visible, currentLocation, onLocationSelect, onClose }: MapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const clickMarkerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !visible || !mapContainerRef.current || mapInitialized) return;

    const center = currentLocation || { lat: 48.8566, lng: 2.3522 };

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 14,
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#e5e7eb" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#22304a" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#7b8a9a" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#252d3d" }] },
        { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16213e" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3d5a80" }] },
      ],
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();

    if (currentLocation) {
      markerRef.current = new window.google.maps.Marker({
        position: currentLocation,
        map,
        title: "Current Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }

    map.addListener("click", async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (clickMarkerRef.current) clickMarkerRef.current.setMap(null);
      clickMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP,
      });

      setIsNavigating(true);
      setErrorMsg(null);
      try {
        const meta = await fetchPanoMetadata({ lat, lng });
        if (meta && meta.status === "OK" && meta.pano_id && meta.location) {
          onLocationSelect({
            panoId: meta.pano_id,
            lat: meta.location.lat,
            lng: meta.location.lng,
            description: meta.location.description,
          });
        } else {
          setErrorMsg("No Street View here. Try clicking on a road or street.");
          if (clickMarkerRef.current) {
            clickMarkerRef.current.setMap(null);
            clickMarkerRef.current = null;
          }
        }
      } catch {
        setErrorMsg("Failed to load Street View for this location.");
      } finally {
        setIsNavigating(false);
      }
    });

    setMapInitialized(true);
  }, [mapsReady, visible, mapInitialized, currentLocation, onLocationSelect]);

  useEffect(() => {
    if (!mapsReady || !mapInitialized || !searchInputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      types: ["geocode", "establishment"],
    });

    if (mapInstanceRef.current) autocomplete.bindTo("bounds", mapInstanceRef.current);
    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      mapInstanceRef.current?.panTo(place.geometry.location);
      mapInstanceRef.current?.setZoom(16);
    });
  }, [mapsReady, mapInitialized]);

  useEffect(() => {
    if (!mapInitialized || !currentLocation) return;
    if (markerRef.current) markerRef.current.setPosition(currentLocation);
    else if (mapInstanceRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position: currentLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }
  }, [currentLocation, mapInitialized]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim() || !geocoderRef.current || !mapInstanceRef.current) return;
      geocoderRef.current.geocode({ address: searchQuery }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          mapInstanceRef.current?.panTo(results[0].geometry.location);
          mapInstanceRef.current?.setZoom(15);
        }
      });
    },
    [searchQuery]
  );

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-4xl mx-4 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{ height: "82vh", maxHeight: "720px" }}
      >
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any place in the world..."
                className="w-full pl-9 pr-4 py-2 bg-white/8 border border-white/15 rounded-xl text-white placeholder-white/35 text-sm focus:outline-none focus:border-blue-400/60 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Go
            </button>
          </form>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={mapContainerRef} className="w-full h-full" style={{ paddingTop: "57px" }} />

        {!mapsReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 pt-14">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto" />
              <p className="text-white/60 text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {isNavigating && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-black/80 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="w-4 h-4 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-white/80 text-sm">Finding Street View...</span>
            </div>
          </div>
        )}

        {errorMsg && !isNavigating && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-2.5 bg-red-950/90 rounded-xl border border-red-500/30 backdrop-blur-md max-w-xs text-center">
              <span className="text-red-200 text-sm">{errorMsg}</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-5 z-10 pointer-events-none">
          <div className="px-3 py-1.5 bg-black/60 rounded-lg border border-white/10 backdrop-blur-md">
            <p className="text-white/40 text-xs">Click on the map to teleport</p>
          </div>
        </div>
      </div>
    </div>
  );
}
