// ============================================================
//  calculations.js  —  All Solar & Battery Math
//  Nashik Home Solar Dashboard
// ============================================================

// ── Helpers ─────────────────────────────────────────────────
const fmt = {
  inr:   v => `₹${Math.round(v).toLocaleString('en-IN')}`,
  kwh:   v => `${v.toFixed(1)} kWh`,
  pct:   v => `${Math.round(v)}%`,
  yrs:   v => !isFinite(v) ? "N/A (Backup Only)" : v >= 1 ? `${v.toFixed(1)} yrs` : `${Math.round(v*12)} mo`,
  dec1:  v => v.toFixed(1),
  dec2:  v => v.toFixed(2),
  int:   v => Math.round(v).toLocaleString('en-IN'),
};

// ── Baseline (no battery) ───────────────────────────────────
function calcBaseline(dailyGenKwh = null) {
  const gen  = dailyGenKwh ?? SYSTEM.monthly_daily_avg.reduce((a,b)=>a+b,0) / 12;
  const cons = SYSTEM.daily_consumption_kwh;

  // During solar hours (~10 hrs), direct solar covers daytime load
  const daytime_load  = cons * SYSTEM.solar_hour_fraction;        // ≈5.46 kWh
  const direct_solar  = Math.min(gen, daytime_load);              // solar used directly
  const surplus       = gen - direct_solar;                        // goes to grid (export)
  const night_load    = cons - direct_solar;                       // needs grid at night

  // True 1:1 Net Metering: Grid offsets units perfectly before billing
  const net_import_kwh = Math.max(0, cons - gen);
  const net_surplus_kwh = Math.max(0, gen - cons);

  const daily_grid_cost  = net_import_kwh * SYSTEM.grid_tariff_inr;
  const daily_export_rev = net_surplus_kwh * SYSTEM.export_rate_inr;
  const daily_net_bill   = daily_grid_cost - daily_export_rev;     // net you pay to grid

  const daily_without_solar_cost = cons * SYSTEM.grid_tariff_inr;
  const daily_savings_vs_nogrid = daily_without_solar_cost - daily_net_bill;

  return {
    gen, cons, daytime_load, direct_solar,
    surplus, night_load,
    daily_grid_cost, daily_export_rev, daily_net_bill,
    annual_gen: gen * 365,
    annual_export: surplus * 365,
    annual_grid_import: night_load * 365,
    annual_grid_cost: daily_grid_cost * 365,
    annual_export_rev: daily_export_rev * 365,
    annual_net_bill: daily_net_bill * 365,
    // Without any solar at all:
    annual_without_solar: cons * SYSTEM.grid_tariff_inr * 365,
    solar_roi_years: SYSTEM.install_cost_inr / (daily_savings_vs_nogrid * 365),
    grid_dependency_pct: (night_load / cons) * 100,
    self_sufficiency_pct: (direct_solar / cons) * 100,
    co2_saved_annual_kg: gen * 365 * SYSTEM.co2_per_kwh_kg,
  };
}

// ── Battery Simulation ──────────────────────────────────────
function calcBattery(batteryKwh, dailyGenKwh = null) {
  const base = calcBaseline(dailyGenKwh);
  const bat  = SYSTEM.batteries.find(b => b.kwh === batteryKwh)
            || { kwh: batteryKwh, ah: Math.round(batteryKwh/0.048), dod: 0.80,
                 cycles: 3500, price_mid: batteryKwh * 15000 };

  const usable_kwh   = bat.kwh * bat.dod;
  const surplus      = base.surplus;                 // kWh available to charge battery
  const night_load   = base.night_load;              // kWh needed at night

  // How much battery actually absorbs from surplus
  // (limited by usable capacity AND inverter max charge rate × ~4 charging hours)
  const max_charge_by_inverter = SYSTEM.inverter_battery_port_kw * 4; // 3kW × 4h = 12 kWh
  const battery_charged  = Math.min(usable_kwh, surplus, max_charge_by_inverter);

  // How much battery can cover at night
  const battery_discharge = Math.min(battery_charged, night_load);

  // Revised grid flows
  const new_grid_import  = night_load  - battery_discharge;  // reduced grid at night
  const new_export       = surplus     - battery_charged;     // reduced export

  // Financial deltas (True Net Metering)
  // Because the grid gives you 1:1 net metering, shifting units locally via battery 
  // provides ZERO additional financial savings compared to using the grid as your battery.
  const daily_grid_saving  = 0;
  const daily_export_loss  = 0;
  const daily_net_saving   = 0;
  const annual_net_saving  = 0;

  // Payback
  const breakeven_yrs = Infinity; // Battery is for backup comfort, not ROI

  // Backup duration (avg household load)
  const avg_load_kw = SYSTEM.daily_consumption_kwh / 24;  // ≈0.54 kW
  const backup_hours_avg = usable_kwh / avg_load_kw;

  // Evening load (7pm–11pm ≈ higher load)
  const evening_load_kw = (night_load * 0.6) / 4;  // 60% of night load in 4 peak evening hours
  const backup_hours_peak = usable_kwh / Math.max(evening_load_kw, 0.5);

  // Charging time (from solar surplus, inverter limited)
  const avg_surplus_rate_kw = surplus / 6;  // spread over ~6 hrs of surplus
  const charge_rate_kw = Math.min(SYSTEM.inverter_battery_port_kw, avg_surplus_rate_kw);
  const charge_time_hrs = usable_kwh / charge_rate_kw;

  // Grid dependency
  const new_grid_pct = (new_grid_import / SYSTEM.daily_consumption_kwh) * 100;
  const old_grid_pct = base.grid_dependency_pct;
  const grid_reduction_pct = old_grid_pct - new_grid_pct;

  // Self-sufficiency
  const new_self_pct = ((base.direct_solar + battery_discharge) / SYSTEM.daily_consumption_kwh) * 100;

  // Battery lifetime savings (3500 cycles = ~9.5 years at 1 cycle/day)
  const lifetime_yrs   = bat.cycles / 365;
  const lifetime_saving = annual_net_saving * Math.min(lifetime_yrs, 12);  // cap at 12 yrs

  // ROI on combined solar + battery
  const total_invest = SYSTEM.install_cost_inr + bat.price_mid;
  const annual_total_saving = (base.daily_savings_vs_nogrid + daily_net_saving) * 365
    // Note: base annual saving already includes direct solar value
    || (SYSTEM.daily_consumption_kwh * SYSTEM.grid_tariff_inr - (new_grid_import * SYSTEM.grid_tariff_inr) + new_export * SYSTEM.export_rate_inr) * 365;

  return {
    bat,
    usable_kwh,
    battery_charged,
    battery_discharge,
    // Revised daily flows
    new_grid_import,
    new_export,
    // Savings
    daily_grid_saving,
    daily_export_loss,
    daily_net_saving,
    annual_net_saving,
    // Payback
    breakeven_yrs,
    lifetime_saving,
    // Backup
    backup_hours_avg: Math.round(backup_hours_avg * 10) / 10,
    backup_hours_peak: Math.round(backup_hours_peak * 10) / 10,
    // Charging
    charge_time_hrs: Math.round(charge_time_hrs * 10) / 10,
    charge_rate_kw: Math.round(charge_rate_kw * 10) / 10,
    // Grid %
    old_grid_pct: Math.round(old_grid_pct),
    new_grid_pct: Math.round(new_grid_pct),
    grid_reduction_pct: Math.round(grid_reduction_pct),
    // Self-sufficiency
    old_self_pct: Math.round(base.self_sufficiency_pct),
    new_self_pct: Math.min(Math.round(new_self_pct), 100),
    // Monthly / annual figures
    monthly_net_saving: daily_net_saving * 30,
    // Derived formatting helpers
    fmt_daily_saving:   fmt.inr(daily_net_saving),
    fmt_monthly_saving: fmt.inr(daily_net_saving * 30),
    fmt_annual_saving:  fmt.inr(annual_net_saving),
    fmt_breakeven:      fmt.yrs(breakeven_yrs),
    fmt_backup_avg:     `${backup_hours_avg.toFixed(1)} hrs`,
    fmt_backup_peak:    `${backup_hours_peak.toFixed(1)} hrs`,
    fmt_charge_time:    `${charge_time_hrs.toFixed(1)} hrs`,
    fmt_price:          fmt.inr(bat.price_mid),
    fmt_price_range:    bat.price_min ? `${fmt.inr(bat.price_min)} – ${fmt.inr(bat.price_max)}` : '—',
    fmt_usable:         `${usable_kwh.toFixed(2)} kWh`,
    fmt_grid_reduction: `${Math.round(grid_reduction_pct)}%`,
    fmt_self_pct:       `${Math.min(Math.round(new_self_pct), 100)}%`,
  };
}

// ── Full Comparison Table ────────────────────────────────────
function calcAllBatteries(dailyGenKwh = null) {
  return SYSTEM.batteries.map(b => calcBattery(b.kwh, dailyGenKwh));
}

// ── Annual Cash Flow (10-year projection) ───────────────────
function calcCashFlow(batteryKwh) {
  const base = calcBaseline();
  const sim  = calcBattery(batteryKwh);
  const tariff_hike = SYSTEM.annual_tariff_hike;

  const rows = [];
  let cumulative_saving = -sim.bat.price_mid;  // start negative (investment)
  let tariff = SYSTEM.grid_tariff_inr;

  for (let yr = 0; yr <= 12; yr++) {
    const annual_saving = yr === 0 ? 0
      : sim.annual_net_saving * Math.pow(1 + tariff_hike, yr - 1);
    cumulative_saving += annual_saving;
    rows.push({
      year: yr,
      annual_saving: Math.round(annual_saving),
      cumulative: Math.round(cumulative_saving),
      payback_reached: cumulative_saving >= 0,
    });
  }
  return rows;
}

// ── Daily Generation Profile (hourly estimate) ──────────────
function getDailyProfile(dailyKwh) {
  // Gaussian-ish solar curve, Nashik lat 20°
  // Hours 0–23, peak around 12–13h
  const curve = [
    0,0,0,0,0,0.01,0.04,0.08,0.12,0.15,0.13,0.12,
    0.10,0.09,0.07,0.05,0.03,0.01,0,0,0,0,0,0
  ];
  const sum = curve.reduce((a,b)=>a+b,0);
  return curve.map(v => (v / sum) * dailyKwh);
}

// ── System Age ROI ───────────────────────────────────────────
function solarRoiYears(annualSaving) {
  return SYSTEM.install_cost_inr / annualSaving;
}

// ── CO₂ ─────────────────────────────────────────────────────
function co2SavedLifetime(annualKwh, years = 25) {
  return annualKwh * years * SYSTEM.co2_per_kwh_kg / 1000;  // tonnes
}

// Export for use in pages
window.CALC = { calcBaseline, calcBattery, calcAllBatteries, calcCashFlow,
                getDailyProfile, fmt, co2SavedLifetime };
