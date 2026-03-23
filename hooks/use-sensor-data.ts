"use client";

import { drivingConfig } from "@/lib/driving-config";
import type { SensorData } from "@/lib/sensor-types";
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
};

const emptyMotion: MotionSnapshot = {
  accelerationX: null,
  accelerationY: null,
  accelerationZ: null,
};

/**
 * Samples geolocation and acceleration every ~500ms while trip is active.
 */
export function useSensorData(isTripActive: boolean): {
  readonly speed: number | null;
  readonly acceleration: SensorData["acceleration"];
  readonly timestamp: number;
  readonly sensorError: string | null;
  readonly requestSensorAccess: () => Promise<void>;
} {
  const [speed, setSpeed] = useState<number | null>(null);
  const [acceleration, setAcceleration] = useState<SensorData["acceleration"]>(null);
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [sensorError, setSensorError] = useState<string | null>(null);
  const geoRef = useRef<GeoSnapshot | null>(null);
  const motionRef = useRef<MotionSnapshot>(emptyMotion);
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
    const motionCtor = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof motionCtor.requestPermission === "function") {
      const state = await motionCtor.requestPermission();
      if (state !== "granted") {
        setSensorError("Device motion permission not granted; acceleration hints may be missing.");
      }
    }
  }, []);
  useEffect(() => {
    if (!isTripActive) {
      setSpeed(null);
      setAcceleration(null);
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
      motionRef.current = {
        accelerationX: a?.x ?? null,
        accelerationY: a?.y ?? null,
        accelerationZ: a?.z ?? null,
      };
    };
    window.addEventListener("devicemotion", onMotion);
    const intervalId = window.setInterval(() => {
      const g = geoRef.current;
      const m = motionRef.current;
      const nextTimestamp = Date.now();
      const speedKmh = g?.speedMps !== null && g?.speedMps !== undefined ? g.speedMps * 3.6 : null;
      setSpeed(speedKmh);
      if (m.accelerationX === null || m.accelerationY === null || m.accelerationZ === null) {
        setAcceleration(null);
      } else {
        setAcceleration({ x: m.accelerationX, y: m.accelerationY, z: m.accelerationZ });
      }
      setTimestamp(nextTimestamp);
    }, drivingConfig.sampleIntervalMs);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("devicemotion", onMotion);
      window.clearInterval(intervalId);
    };
  }, [isTripActive]);
  return { speed, acceleration, timestamp, sensorError, requestSensorAccess };
}
