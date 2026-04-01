import { useState, useEffect, useCallback } from "react";
import { VRScene } from "@/components/VRScene";
import { MapPanel } from "@/components/MapPanel";
import { PanoramaInfo, findValidPanorama } from "@/lib/streetview";
import { loadGoogleMaps, GoogleMapsLoadError } from "@/lib/maps-loader";

type AppState = "loading-maps" | "finding-pano" | "ready" | "error-auth" | "error-no-pano" | "error-unknown";

export function VRApp() {
  const [appState, setAppState] = useState<AppState>("loading-maps");
  const [panoramaInfo, setPanoramaInfo] = useState<PanoramaInfo | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        await loadGoogleMaps();
        setAppState("finding-pano");

        const info = await findValidPanorama();
        if (info) {
          setPanoramaInfo(info);
          setAppState("ready");
        } else {
          setAppState("error-no-pano");
        }
      } catch (e) {
        if (e instanceof GoogleMapsLoadError && e.code === "API_NOT_ACTIVATED") {
          setAppState("error-auth");
        } else {
          setAppState("error-unknown");
        }
      }
    }
    boot();
  }, []);

  const handleLocationSelect = useCallback((info: PanoramaInfo) => {
    setPanoramaInfo(info);
    setMapVisible(false);
  }, []);

  const handleToggleMap = useCallback(() => setMapVisible((v) => !v), []);

  if (appState === "loading-maps" || appState === "finding-pano") {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-white text-base font-medium">
              {appState === "loading-maps" ? "Loading Maps API..." : "Finding a Street View location..."}
            </p>
            <p className="text-white/30 text-sm">Street View VR</p>
          </div>
        </div>
      </div>
    );
  }

  if (appState === "error-auth") {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">API Setup Required</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Enable these APIs in Google Cloud Console for your key.
            </p>
          </div>
          <div className="bg-white/4 rounded-2xl border border-white/8 p-5 text-left space-y-3">
            {["Maps JavaScript API", "Street View Static API", "Places API"].map((api, i) => (
              <div key={api} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i < 2 ? "bg-amber-400" : "bg-blue-400"}`} />
                <span className="text-white/70 text-sm">{api}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${i < 2 ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                  {i < 2 ? "Required" : "Search"}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
            Refresh &amp; Try Again
          </button>
        </div>
      </div>
    );
  }

  if (appState === "error-no-pano" || appState === "error-unknown") {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center px-6 space-y-4 max-w-md">
          <p className="text-red-400 text-lg font-semibold">
            {appState === "error-no-pano" ? "No Street View location found" : "Something went wrong"}
          </p>
          <p className="text-white/40 text-sm">
            {appState === "error-no-pano"
              ? "Make sure Street View Static API is enabled on your key."
              : "Check your API key configuration and try again."}
          </p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-sm font-medium transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <VRScene
        panoramaInfo={panoramaInfo}
        isLoading={false}
        onToggleMap={handleToggleMap}
        mapVisible={mapVisible}
      />
      <MapPanel
        visible={mapVisible}
        currentLocation={panoramaInfo ? { lat: panoramaInfo.lat, lng: panoramaInfo.lng } : null}
        onLocationSelect={handleLocationSelect}
        onClose={() => setMapVisible(false)}
      />
    </div>
  );
}
