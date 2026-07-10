"use client"

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const DEFAULT_CENTER: [number, number] = [-15.7801, -47.9292]; // Brasília

interface ClientLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ClientLocationMap({ latitude, longitude, onChange }: ClientLocationMapProps) {
  const [manualLat, setManualLat] = useState(latitude?.toString() ?? "");
  const [manualLng, setManualLng] = useState(longitude?.toString() ?? "");

  const hasPosition = latitude != null && longitude != null;
  const position: [number, number] = hasPosition ? [latitude, longitude] : DEFAULT_CENTER;

  const applyManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onChange(lat, lng);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-bold text-sm">Latitude</Label>
          <Input
            placeholder="-15.7801"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            onBlur={applyManual}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-sm">Longitude</Label>
          <Input
            placeholder="-47.9292"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            onBlur={applyManual}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
      <div className="h-72 rounded-2xl overflow-hidden border">
        <MapContainer center={position} zoom={hasPosition ? 15 : 4} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPosition && (
            <Marker position={[latitude, longitude]} icon={markerIcon} />
          )}
          <ClickHandler
            onChange={(lat, lng) => {
              onChange(lat, lng);
              setManualLat(lat.toFixed(6));
              setManualLng(lng.toFixed(6));
            }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">Clique no mapa para marcar a localização do cliente.</p>
    </div>
  );
}
