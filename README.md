# ☀️ Solar HQ — Home Solar Dashboard
**Nashik · 5kW Havells Enviro GTi Hybrid · GitHub Pages**

## Deploy
1. Push folder to GitHub repo
2. Settings → Pages → Source: main / root
3. Live at `https://<username>.github.io/solar-dashboard/`

## Customise: edit `js/data.js`
- `SYSTEM.dailyConsumption`, `gridTariff`, `exportRate`
- `SYSTEM.april2026Daily` — paste new Solarman data anytime
- `BATTERIES` — update prices as market changes

## Files
- `index.html` — Dashboard: stats, energy flow, monthly chart, ROI
- `simulator.html` — Battery simulator: select size, see all metrics
- `css/styles.css` — Design system
- `js/data.js` — All your system data
- `js/calculations.js` — Simulation engine
