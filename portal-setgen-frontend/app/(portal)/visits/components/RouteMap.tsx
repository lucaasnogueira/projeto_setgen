"use client"

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { TechnicalVisit } from "@/types";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface RouteMapProps {
  visits: (TechnicalVisit & { routeOrder?: number })[];
}

export function RouteMap({ visits }: RouteMapProps) {
  const stops = visits.filter(
    (v) => v.client?.latitude != null && v.client?.longitude != null,
  );

  if (stops.length === 0) {
    return (
      <div className="h-72 rounded-2xl border flex items-center justify-center text-sm text-muted-foreground">
        Nenhum cliente com coordenadas cadastradas para exibir no mapa.
      </div>
    );
  }

  const positions: [number, number][] = stops.map((v) => [
    v.client!.latitude!,
    v.client!.longitude!,
  ]);

  return (
    <div className="h-96 rounded-2xl overflow-hidden border">
      <MapContainer bounds={L.latLngBounds(positions)} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.map((v, i) => (
          <Marker key={v.id} position={positions[i]} icon={markerIcon}>
            <Popup>
              {v.routeOrder ? `${v.routeOrder}. ` : ""}
              {v.client?.companyName}
            </Popup>
          </Marker>
        ))}
        <Polyline positions={positions} color="#ea580c" />
      </MapContainer>
    </div>
  );
}
