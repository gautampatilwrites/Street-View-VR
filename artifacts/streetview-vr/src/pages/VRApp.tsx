import { useState, useEffect, useCallback } from "react";
import { VRScene } from "@/components/VRScene";
import { MapPanel } from "@/components/MapPanel";
import { PanoramaInfo, findValidPanorama } from "@/lib/streetview";
import { loadGoogleMaps, GoogleMapsLoadError } from "@/lib/maps-loader";

type ErrorType = "auth" | "no_coverage" | "unknown" | null;

export function VRApp() {
  const [panoramaInfo, setPanoramaInfo] = useState<PanoramaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsApiLoaded(true))
      .catch((e) => {
        if (e instanceof GoogleMapsLoadError && e.code === "API_NOT_ACTIVATED") {
          setErrorType("auth");
        } else {
          setErrorType("unknown");
        }
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!mapsApiLoaded) return;

    async function init() {
      setIsLoading(true);
      setErrorType(null);
      try {
        const info = await findValidPanorama();
        if (info) {
          setPanoramaInfo(info);
        } else {
          setErrorType("no_coverage");
        }
      } catch {
        setErrorType("unknown");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [mapsApiLoaded]);

  const handleLocationSelect = useCallback((info: PanoramaInfo) => {
    setPanoramaInfo(info);
    setMapVisible(false);
    setIsLoading(false);
    setErrorType(null);
  }, []);

  const handleToggleMap = useCallback(() => {
    setMapVisible((v) => !v);
  }, []);

  if (errorType === "auth") {
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
              Your Google Maps API key needs the following APIs enabled in Google Cloud Console.
            </p>
          </div>

          <div className="bg-white/4 rounded-2xl border border-white/8 p-5 text-left space-y-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Enable these APIs</p>
            <div className="space-y-3">
              {[
                { name: "Maps JavaScript API", required: true },
                { name: "Street View Static API", required: true },
                { name: "Places API", required: false },
              ].map((api) => (
                <div key={api.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${api.required ? "bg-amber-400" : "bg-blue-400"}`} />
                    <span className="text-white/70 text-sm">{api.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${api.required ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                    {api.required ? "Required" : "For search"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/4 rounded-2xl border border-white/8 p-5 text-left space-y-3">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Steps</p>
            <ol className="space-y-2">
              {[
                "Go to console.cloud.google.com",
                "Open APIs & Services → Library",
                'Search each API and click "Enable"',
                "Return here and refresh the page",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/50">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={() => { window.location.reload(); }}
            className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            Refresh &amp; Try Again
          </button>
        </div>
      </div>
    );
  }

  if (errorType === "no_coverage" || errorType === "unknown") {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center px-6 space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-semibold">
            {errorType === "no_coverage" ? "No panorama found" : "Something went wrong"}
          </h1>
          <p className="text-white/50 text-sm">
            {errorType === "no_coverage"
              ? "Could not find a valid Street View location. Make sure Street View Static API is enabled."
              : "An error occurred. Check your API key configuration."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-sm font-medium transition-colors"
          >
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
        isLoading={isLoading}
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
