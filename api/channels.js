import { gunzipSync } from 'node:zlib';

const SOURCE = 'https://raw.githubusercontent.com/Halehahn/FreeTV/a43e61811a7bce5abf80c84f43912e22cbb19d2c/index.html';

export default async function handler(req, res) {
  try {
    const r = await fetch(SOURCE);
    if (!r.ok) throw new Error(`Source GitHub indisponible (${r.status})`);
    const html = await r.text();
    const m = html.match(/const packed="([A-Za-z0-9+/=]+)";/);
    if (!m) throw new Error('Données introuvables dans la version source');
    const json = gunzipSync(Buffer.from(m[1], 'base64')).toString('utf8');
    const data = JSON.parse(json);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
