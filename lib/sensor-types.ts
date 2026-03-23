/** Single aggregated sensor reading (~500ms cadence). */
export type SensorSample = {
  readonly timestamp: number;
  readonly latitude: number | null;
  readonly longitude: number | null;
  /** Ground speed from Geolocation API when available (m/s). */
  readonly speedMps: number | null;
  readonly accelerationX: number | null;
  readonly accelerationY: number | null;
  readonly accelerationZ: number | null;
  readonly rotationAlpha: number | null;
  readonly rotationBeta: number | null;
  readonly rotationGamma: number | null;
};

export type SensorData = {
  readonly speed: number | null;
  readonly acceleration: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  } | null;
  readonly timestamp: number;
};

export type TripEventType = "harsh_brake" | "rapid_acceleration" | "speeding";

/** Persisted / in-memory driving event. */
export type TripEvent = {
  readonly type: TripEventType;
  readonly timestamp: number;
  readonly value: number;
};
