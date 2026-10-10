import {searchVictoriaLocations} from '../lib/victoriaLocations.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const query = new URL(req.url, 'http://localhost').searchParams.get('q');
    return res.status(200).json({results:await searchVictoriaLocations(query)});
  } catch {
    return res.status(503).json({error:'Address suggestions are unavailable. You can enter your address manually.'});
  }
}
