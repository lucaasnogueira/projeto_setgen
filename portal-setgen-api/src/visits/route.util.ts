export interface RoutePoint {
  id: string;
  lat: number | null;
  lng: number | null;
}

export interface OrderedRouteResult<T extends RoutePoint> {
  ordered: T[];
  totalDistanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

/** Distância em linha reta (haversine) entre dois pontos, em km. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Ordenação gulosa (nearest-neighbor) sobre pontos com coordenadas.
 * Pontos sem lat/lng são excluídos do cálculo de distância e anexados no
 * final, na ordem original, sem contribuir pra distância total.
 * Ponto de partida = primeiro item do array de entrada (o chamador deve
 * ordenar por horário antes de passar).
 */
export function nearestNeighborRoute<T extends RoutePoint>(
  points: T[],
): OrderedRouteResult<T> {
  const geocoded = points.filter((p) => p.lat !== null && p.lng !== null);
  const ungeocoded = points.filter((p) => p.lat === null || p.lng === null);

  if (geocoded.length === 0) {
    return { ordered: [...ungeocoded], totalDistanceKm: 0 };
  }

  const remaining = [...geocoded];
  const ordered: T[] = [remaining.shift()!];
  let totalDistanceKm = 0;

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(
        current.lat!,
        current.lng!,
        remaining[i].lat!,
        remaining[i].lng!,
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    totalDistanceKm += nearestDist;
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return { ordered: [...ordered, ...ungeocoded], totalDistanceKm };
}
