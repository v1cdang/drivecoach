"use client";

import { drivingConfig } from "@/lib/driving-config";
import type { SensorSample } from "@/lib/sensor-types";
import { useCallback, useEffect, useRef, useState } from "react";

type GeoSnapshot = {
  readonly latitude: number;
  readonly longitude: number;
  readonly speedMps: number | null;
};

type MotionSnapshot = {
  readonly accelerationX: number | null;
  readonly accelerationY: number | null;
  readonly accelerationZ: number | null;
  readonly rotationAlpha: number | null;
  readonly rotationBeta: number | null;
  readonly rotationGamma: number | null;
};

const emptyMotion: MotionSnapshot = {
  accelerationX: null,
  accelerationY: null,
  accelerationZ: null,
  rotationAlpha: null,
  rotationBeta: null,
  rotationGamma: null,
};

/**
 * Subscribes to Geolocation + DeviceMotion while `isRecording` is true, then every
 * ~500ms builds one {@link SensorSample} so detection logic sees stable cadence.
 */
export function useSensorData(
  isRecording: boolean,
  onSample: (sample: SensorSample) => void,
): {
  readonly sensorError: string | null;
  readonly requestSensorAccess: () => Promise<void>;
} {
  const [sensorError, setSensorError] = useState<string | null>(null);
  const geoRef = useRef<GeoSnapshot | null>(null);
  const motionRef = useRef<MotionSnapshot>(emptyMotion);
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;
  const requestSensorAccess = useCallback(async (): Promise<void> => {
    setSensorError(null);
    await new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => reject(err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      );
    }).catch((err: unknown) => {
      const message = err instanceof GeolocationPositionError ? err.message : String(err);
      setSensorError(message);
      throw err;
    });
    const orientationCtor = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof orientationCtor.requestPermission === "function") {
      const state = await orientationCtor.requestPermission();
      if (state !== "granted") {
        setSensorError("Device motion permission not granted; gyro/accel hints may be missing.");
      }
    }
  }, []);
  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }
    if (!navigator.geolocation) {
      setSensorError("Geolocation not available");
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const s = pos.coords.speed;
        geoRef.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speedMps:
            s !== null && s !== undefined && !Number.isNaN(s) ? Math.max(0, s) : null,
        };
      },
      (err) => setSensorError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    const onMotion = (e: DeviceMotionEvent): void => {
      const a = e.acceleration;
      const r = e.rotationRate;
      motionRef.current = {
        accelerationX: a?.x ?? null,
        accelerationY: a?.y ?? null,
        accelerationZ: a?.z ?? null,
        rotationAlpha: r?.alpha ?? null,
        rotationBeta: r?.beta ?? null,
        rotationGamma: r?.gamma ?? null,
      };
    };
    window.addEventListener("devicemotion", onMotion);
    const intervalId = window.setInterval(() => {
      const g = geoRef.current;
      const m = motionRef.current;
      const sample: SensorSample = {
        timestamp: Date.now(),
        latitude: g?.latitude ?? null,
        longitude: g?.longitude ?? null,
        speedMps: g?.speedMps ?? null,
        accelerationX: m.accelerationX,
        accelerationY: m.accelerationY,
        accelerationZ: m.accelerationZ,
        rotationAlpha: m.rotationAlpha,
        rotationBeta: m.rotationBeta,
        rotationGamma: m.rotationGamma,
      };
      onSampleRef.current(sample);
    }, drivingConfig.sampleIntervalMs);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("devicemotion", onMotion);
      window.clearInterval(intervalId);
    };
  }, [isRecording]);
  return { sensorError, requestSensorAccess };
}
