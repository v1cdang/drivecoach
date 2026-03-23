"use client";

import type { TripRoutePoint } from "@/hooks/use-trip-session";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

type LiveTripMapProps = {
  readonly routePoints: readonly TripRoutePoint[];
  readonly currentLatitude: number | null;
  readonly currentLongitude: number | null;
};

type FollowMapViewProps = {
  readonly latitude: number;
  readonly longitude: number;
};

function FollowMapView(props: FollowMapViewProps): null {
  const map = useMap();
  const lastCenterAtRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastCenterAtRef.current < 1200) {
      return;
    }
    lastCenterAtRef.current = now;
    map.flyTo([props.latitude, props.longitude], map.getZoom(), { animate: false });
  }, [map, props.latitude, props.longitude]);
  return null;
}

/**
 * Lightweight real-time trip map with live point and recent route path.
 */
export function LiveTripMap(props: LiveTripMapProps) {
  const hasLocation = props.currentLatitude !== null && props.currentLongitude !== null;
  const polylinePoints = useMemo(
    () => props.routePoints.map((point) => [point.latitude, point.longitude] as [number, number]),
    [props.routePoints],
  );
  if (!hasLocation) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Waiting for GPS location...</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800">
      <MapContainer
        center={[props.currentLatitude, props.currentLongitude]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FollowMapView latitude={props.currentLatitude} longitude={props.currentLongitude} />
        {polylinePoints.length > 1 ? <Polyline positions={polylinePoints} pathOptions={{ color: "#10b981" }} /> : null}
        <CircleMarker center={[props.currentLatitude, props.currentLongitude]} radius={6} pathOptions={{ color: "#22c55e" }} />
      </MapContainer>
    </div>
  );
}
