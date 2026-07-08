"use client"

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Ícone padrão do Leaflet não carrega certo com bundlers - aponta pros assets do CDN
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface ClientLocationViewProps {
  latitude?: number;
  longitude?: number;
}

export function ClientLocationView({ latitude, longitude }: ClientLocationViewProps) {
  if (latitude === undefined || longitude === undefined) {
    return (
      <div className="h-72 rounded-2xl border flex items-center justify-center text-[13px] text-text-muted">
        Localização não informada para este cliente.
      </div>
    );
  }

  const position: [number, number] = [latitude, longitude];

  return (
    <div className="h-72 rounded-2xl overflow-hidden border">
      <MapContainer center={position} zoom={15} className="h-full w-full" dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
