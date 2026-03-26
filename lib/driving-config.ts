/** Tunable detection thresholds; speed limit from public env (km/h). */
const DEFAULT_SPEED_LIMIT_KMH = 100;

function readSpeedLimitKmh(): number {
  const raw = process.env.NEXT_PUBLIC_SPEED_LIMIT_KMH;
  if (raw === undefined || raw === "") {
    return DEFAULT_SPEED_LIMIT_KMH;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SPEED_LIMIT_KMH;
}

/** Reference: 0 → 25 km/h in 5 s ⇒ mean longitudinal accel ≈ 1.39 m/s² (~0.14 g). */
const GENTLE_ZERO_TO_25_KMH_SECONDS = 5;
const GENTLE_ZERO_TO_25_KMH = 25;

/** Runtime tuning for sampling, detection, and voice (read by hooks on client). */
export const drivingConfig = {
  sampleIntervalMs: 500,
  /** GPS speed history window for mean longitudinal accel (matches “0–25 km/h in 5 s” baseline). */
  accelerationRollingWindowMs: 5000,
  /** Require at least this span between oldest and newest sample in the window (reduces spike noise). */
  accelerationMinWindowMs: 2500,
  /**
   * Mean longitudinal accel (m/s²) over the rolling window must exceed this for rapid acceleration.
   * ~2.94 m/s² ≈ 0.3 g sustained; well above gentle 0→25 km/h in 5 s (~1.39 m/s² mean).
   */
  rapidMinAvgAccelerationMps2: 2.94,
  /** Same window, negative direction, magnitude threshold for harsh braking. */
  harshBrakeMinAvgAbsMps2: 2.94,
  /** Device-accel fallback when GPS speed is missing (m/s²). */
  accelFallbackMps2: 5.5,
  /** Do not use accelerometer for rapid acceleration when GPS speed is below this (km/h). */
  lowSpeedAccelSuppressKmh: 15,
  /** Legacy instant delta (m/s²) for lib/detect-driving-events.ts only. */
  harshBrakeSpeedDropMps: 4.2,
  fastAccelSpeedGainMps: 4.2,
  harshAccelImpulseMps2: 16,
  sharpTurnRotationDps: 45,
  get speedLimitMps(): number {
    return readSpeedLimitKmh() / 3.6;
  },
  get speedLimitKmh(): number {
    return readSpeedLimitKmh();
  },
  get gentleAccelerationReferenceMps2(): number {
    return GENTLE_ZERO_TO_25_KMH / 3.6 / GENTLE_ZERO_TO_25_KMH_SECONDS;
  },
} as const;
