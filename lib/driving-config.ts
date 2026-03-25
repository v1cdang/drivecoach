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

/** Runtime tuning for sampling, detection, and voice (read by hooks on client). */
export const drivingConfig = {
  sampleIntervalMs: 500,
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
} as const;
