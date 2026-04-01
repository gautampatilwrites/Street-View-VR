import { Router, type IRouter } from "express";

const router: IRouter = Router();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get("/sv/metadata", async (req, res) => {
  const { lat, lng, panoid } = req.query as Record<string, string>;

  if (!API_KEY) {
    res.status(500).json({ error: "API key not configured" });
    return;
  }

  let url: string;
  if (panoid) {
    url = `https://maps.googleapis.com/maps/api/streetview/metadata?pano=${panoid}&key=${API_KEY}`;
  } else if (lat && lng) {
    url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=500&source=outdoor&key=${API_KEY}`;
  } else {
    res.status(400).json({ error: "lat/lng or panoid required" });
    return;
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "sv metadata fetch failed");
    res.status(500).json({ error: "metadata fetch failed" });
  }
});

router.get("/sv/tile", async (req, res) => {
  const { panoid, zoom, x, y } = req.query as Record<string, string>;

  if (!panoid || zoom === undefined || x === undefined || y === undefined) {
    res.status(400).send("panoid, zoom, x, y required");
    return;
  }

  const tileUrl = `https://cbk0.google.com/cbk?output=tile&panoid=${panoid}&zoom=${zoom}&x=${x}&y=${y}`;

  try {
    const r = await fetch(tileUrl);
    if (!r.ok) {
      res.status(r.status).send("tile fetch failed");
      return;
    }
    const contentType = r.headers.get("content-type") || "image/jpeg";
    const buffer = await r.arrayBuffer();
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch (err) {
    req.log.error({ err }, "sv tile fetch failed");
    res.status(500).send("tile fetch failed");
  }
});

export default router;
