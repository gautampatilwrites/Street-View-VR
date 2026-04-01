import { useEffect, useRef, useState } from "react";
import { PanoramaInfo } from "@/lib/streetview";
import { loadGoogleMaps } from "@/lib/maps-loader";

interface VRSceneProps {
  panoramaInfo: PanoramaInfo | null;
  isLoading: boolean;
  onToggleMap: () => void;
  mapVisible: boolean;
}

export function VRScene({ panoramaInfo, isLoading, onToggleMap, mapVisible }: VRSceneProps) {
  const panoContainerRef = useRef<HTMLDivElement>(null);
  const panoInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [panoError, setPanoError] = useState(false);

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !panoContainerRef.current || panoInstanceRef.current) return;

    const pano = new window.google.maps.StreetViewPanorama(panoContainerRef.current, {
      pano: panoramaInfo?.panoId,
      position: panoramaInfo
        ? { lat: panoramaInfo.lat, lng: panoramaInfo.lng }
        : { lat: 48.8566, lng: 2.3522 },
      pov: { heading: 0, pitch: 0 },
      zoom: 0,
      addressControl: false,
      showRoadLabels: false,
      fullscreenControl: false,
      motionTracking: true,
      motionTrackingControl: true,
      linksControl: true,
      panControl: false,
      zoomControl: false,
      enableCloseButton: false,
    });

    pano.addListener("status_changed", () => {
      const status = pano.getStatus();
      if (status === window.google.maps.StreetViewStatus.ZERO_RESULTS) {
        setPanoError(true);
      } else {
        setPanoError(false);
      }
    });

    panoInstanceRef.current = pano;
  }, [mapsReady]);

  useEffect(() => {
    if (!panoInstanceRef.current || !panoramaInfo) return;
    setPanoError(false);
    panoInstanceRef.current.setPano(panoramaInfo.panoId);
    panoInstanceRef.current.setPov({ heading: 0, pitch: 0 });
  }, [panoramaInfo]);

  return (
    <div className="relative w-full h-full bg-black select-none">
      <div
        ref={panoContainerRef}
        style={{ width: "100%", height: "100%" }}
      />

      {!mapsReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white text-lg font-medium tracking-wide">Initializing Street View...</p>
          </div>
        </div>
      )}

      {mapsReady && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white text-lg font-medium tracking-wide">Loading panorama...</p>
          </div>
        </div>
      )}

      {panoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
          <div className="text-center space-y-2 px-6">
            <p className="text-red-400 text-lg font-semibold">No Street View available here</p>
            <p className="text-white/60 text-sm">Open the map and try a different location</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <button
          onClick={onToggleMap}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 shadow-2xl border ${
            mapVisible
              ? "bg-white text-black border-white/50"
              : "bg-black/60 text-white border-white/20 backdrop-blur-md hover:bg-black/80 hover:border-white/40"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {mapVisible ? "Close Map" : "Open Map"}
        </button>
      </div>

      {panoramaInfo?.description && !mapVisible && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 text-white/80 text-sm font-medium max-w-xs text-center truncate">
            {panoramaInfo.description}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
          <span className="text-white/40 text-xs font-medium">Street View VR</span>
        </div>
      </div>
    </div>
  );
}
