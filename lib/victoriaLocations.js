import localitiesSnapshot from './victoriaLocalities.js';
const cache = new Map();
const localityEndpoint = 'https://services-ap1.arcgis.com/P744lA0wf4LlBZ84/ArcGIS/rest/services/Vicmap_Admin/FeatureServer/11/query';
let localities = localitiesSnapshot;
let refreshAt = 0;
let refreshing;
async function refreshLocalities() {
  const names = new Set();
  for (let offset = 0; ; offset += 2000) {
    const params = new URLSearchParams({where:'1=1', outFields:'locality_name', returnGeometry:'false', f:'json', resultRecordCount:'2000', resultOffset:String(offset), orderByFields:'locality_name'});
    const response = await fetch(`${localityEndpoint}?${params}`, {signal:AbortSignal.timeout(8000)});
    const data = await response.json();
    if (!response.ok || data.error || !Array.isArray(data.features)) throw new Error('Locality service unavailable');
    for (const row of data.features) if (row.attributes?.locality_name) names.add(row.attributes.locality_name);
    if (!data.exceededTransferLimit) break;
  }
  if (names.size) localities = [...names].sort();
}
const popular = ['MELBOURNE', 'DANDENONG', 'WERRIBEE', 'FOOTSCRAY', 'SUNSHINE', 'POINT COOK', 'TARNEIT', 'CRAIGIEBURN', 'EPPING', 'FRANKSTON', 'GEELONG', 'BALLARAT CENTRAL', 'BENDIGO'];
function localityResults(query) {
  const text = query.toUpperCase();
  const matches = localities.filter(name => name.includes(text));
  matches.sort((a,b) => {
    if (text) return Number(b === text) - Number(a === text) || Number(b.startsWith(text)) - Number(a.startsWith(text)) || a.localeCompare(b);
    const rank = name => popular.indexOf(name) < 0 ? popular.length : popular.indexOf(name);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  return matches.map(name => ({label:`${name.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())}, VIC, Australia`}));
}

export async function searchVictoriaLocations(value) {
  const query = String(value || '').trim().slice(0, 160);
  // Serve the official snapshot immediately, while refreshing the government API in the background.
  if (!refreshing && Date.now() > refreshAt) {
    refreshAt = Date.now() + 3600000;
    refreshing = refreshLocalities().catch(() => { refreshAt = Date.now() + 60000; }).finally(() => { refreshing = undefined; });
  }
  const areas = localityResults(query);
  if (areas.length || query.length < 3) return areas;
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.results;
  const url = new URL('https://photon.komoot.io/api/');
  url.search = new URLSearchParams({q: query, countrycode:'AU', bbox:'140.9,-39.3,150.1,-33.9', lon:'144.9631', lat:'-37.8136', limit:'15', lang:'en'}).toString();
  const response = await fetch(url, {signal:AbortSignal.timeout(8000), headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Address search is unavailable.');
  const data = await response.json();
  const unique = new Map();
  for (const feature of data.features || []) {
    const p = feature.properties || {};
    if (!/^(Victoria|VIC)$/i.test(p.state || '') || (p.countrycode && p.countrycode.toUpperCase() !== 'AU')) continue;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const parts = [...new Set([p.name, street, p.city || p.district || p.county].filter(Boolean))];
    if (!parts.length) continue;
    const label = [...parts, ['VIC', p.postcode].filter(Boolean).join(' '), 'Australia'].join(', ');
    unique.set(label, {label});
  }
  const results = [...unique.values()].slice(0, 8);
  if (cache.size >= 200) cache.delete(cache.keys().next().value);
  cache.set(key, {results, expires:Date.now() + 300000});
  return results;
}
