// Roughly where this request came from, as Vercel's edge already worked it out: country, region, city and
// the city's coordinates. The visitor's IP address is not read, returned or stored anywhere by us.
module.exports = (req, res) => {
  const h = req.headers, num = v => { const x = parseFloat(v); return Number.isFinite(x) ? x : null; };
  let city = h['x-vercel-ip-city'] || ''; try { city = decodeURIComponent(city); } catch (e) { }
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ country: h['x-vercel-ip-country'] || null, region: h['x-vercel-ip-country-region'] || null, city: city || null, lat: num(h['x-vercel-ip-latitude']), lon: num(h['x-vercel-ip-longitude']) });
};
