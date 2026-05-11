// ============================================================
//  data.js  —  Your Solar System Constants & Historical Data
//  Nashik Home · Havells Enviro GTi Hybrid · 5kW System
// ============================================================

const SYSTEM = {
  // ── Identity ─────────────────────────────────────────────
  name:       "Home Solar Dashboard",
  location:   "Nashik, Maharashtra",
  lat:        20.0059,
  lng:        73.7898,

  // ── Solar Hardware ───────────────────────────────────────
  capacity_kw:              5,
  inverter_brand:           "Havells",
  inverter_model:           "Enviro GTi Hybrid",
  inverter_serial:          "SH3ES450R64129",
  inverter_mfg_date:        "2025-06-04",
  inverter_battery_port_kw: 3,       // max charge/discharge rate
  battery_voltage:          48,      // Volt system
  monitoring_app:           "Solarman Smart",

  // ── Generation (from Solarman + Nashik solar irradiance) ─
  // Monthly averages (kWh/day), Jan–Dec. April confirmed from app.
  monthly_daily_avg: [
    14.5,  // Jan – winter haze, shorter days
    16.2,  // Feb
    19.0,  // Mar – rising sun angle
    20.8,  // Apr ← CONFIRMED from Solarman (623.21 kWh / 30 days)
    20.2,  // May – heat + slight dust haze
    14.8,  // Jun – monsoon begins
    13.0,  // Jul – heavy overcast
    12.5,  // Aug – peak monsoon
    14.5,  // Sep – clearing up
    17.5,  // Oct
    16.0,  // Nov
    14.2   // Dec
  ],

  // Actual data from Solarman screenshot
  april_2026: {
    monthly_kwh:      623.21,
    daily_avg_kwh:    20.77,
    estimated_revenue_inr: 225.55,   // net metering credit shown in app
  },

  // Annual estimate (sum of monthly avgs × days in month)
  get annual_kwh_est() {
    const days = [31,28,31,30,31,30,31,31,30,31,30,31];
    return this.monthly_daily_avg.reduce((sum, v, i) => sum + v * days[i], 0);
  },

  // ── Consumption ──────────────────────────────────────────
  daily_consumption_kwh: 13,    // avg of user-stated 12–14 units/day
  solar_hour_fraction:   0.42,  // fraction of day with meaningful solar (≈10h of 24h)
                                 // → daytime consumption = 13 × 0.42 = 5.46 kWh

  // ── Financial ────────────────────────────────────────────
  grid_tariff_inr:      9.0,    // ₹/unit (user said 8–10, using midpoint ₹9)
  export_rate_inr:      2.8,    // ₹/unit MSEDCL net metering credit
  install_cost_inr:     300000, // ₹3 lakhs (solar system only)
  annual_tariff_hike:   0.05,   // 5% electricity tariff increase per year (historical avg)

  // ── CO₂ ──────────────────────────────────────────────────
  co2_per_kwh_kg:       0.82,   // India grid emission factor (CEA 2024)

  // ── Battery Options (LiFePO4, 48V) ───────────────────────
  batteries: [
    {
      kwh:       2.4,
      ah:        50,
      label:     "2.4 kWh",
      dod:       0.80,          // depth of discharge (80% for LiFePO4)
      cycles:    3500,          // typical cycle life
      price_min: 35000,
      price_max: 45000,
      price_mid: 40000,
      brands:    ["Luminous Li-ON 2048", "Genus Lacche+ 48V50Ah"],
      pro:       "Lowest cost entry point",
      con:       "Only ~2 hrs backup. Won't cover night loads.",
      budget_ok: true,
      recommended: false,
    },
    {
      kwh:       4.8,
      ah:        100,
      label:     "4.8 kWh",
      dod:       0.80,
      cycles:    3500,
      price_min: 65000,
      price_max: 85000,
      price_mid: 75000,
      brands:    ["Livguard LGSP48100", "Luminous Li-ON 4896", "Loom Solar 4800Wh"],
      pro:       "Covers all power cuts + stores most surplus. Best ROI.",
      con:       "Won't cover full night load — still needs some grid at night.",
      budget_ok: true,
      recommended: true,
    },
    {
      kwh:       7.2,
      ah:        150,
      label:     "7.2 kWh",
      dod:       0.80,
      cycles:    3500,
      price_min: 95000,
      price_max: 115000,
      price_mid: 105000,
      brands:    ["Livguard LGSP48150", "Loom Solar 7200Wh"],
      pro:       "Near-full night coverage. Great for extended outages.",
      con:       "Slightly over ₹1L budget. Diminishing returns vs 4.8 kWh.",
      budget_ok: false,
      recommended: false,
    },
    {
      kwh:       9.6,
      ah:        200,
      label:     "9.6 kWh",
      dod:       0.80,
      cycles:    3500,
      price_min: 125000,
      price_max: 155000,
      price_mid: 140000,
      brands:    ["Livguard LGSP48200", "Loom Solar 9600Wh"],
      pro:       "Full night independence. Almost zero grid import.",
      con:       "Well over budget. Very long payback period.",
      budget_ok: false,
      recommended: false,
    },
  ],

  // ── Month Names ──────────────────────────────────────────
  months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};

// Freeze so it can't be accidentally mutated
Object.freeze(SYSTEM);
