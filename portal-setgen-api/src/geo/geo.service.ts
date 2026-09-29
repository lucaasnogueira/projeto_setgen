import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  source: 'GOOGLE_MAPS_URL' | 'HERE_MAPS' | 'FOURSQUARE' | 'NOMINATIM';
}

@Injectable()
export class GeoService {
  /**
   * Extrai latitude e longitude de URLs do Google Maps (curtas ou completas)
   */
  async extractFromGoogleMapsUrl(rawUrl: string): Promise<GeoLocationResult> {
    let targetUrl = rawUrl.trim();

    try {
      // Se for URL encurtada ou redirect, segue até a URL final
      const response = await axios.get(targetUrl, {
        maxRedirects: 10,
        validateStatus: () => true, // Não estoura erro com 301/302/404
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      // Pega a URL final resolvida
      if (response.request?.res?.responseUrl) {
        targetUrl = response.request.res.responseUrl;
      }
    } catch {
      // Se a requisição falhar (ex: rede offline), tenta rodar a regex na própria URL passada
    }

    // Padrões comuns de coordenadas em URLs do Google Maps
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/, // @-23.55052,-46.633308
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?q=-23.55052,-46.633308
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?ll=-23.55052,-46.633308
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3d-23.55052!4d-46.633308
      /place\/(-?\d+\.\d+),(-?\d+\.\d+)/, // place/-23.55052,-46.633308
    ];

    let lat: number | null = null;
    let lng: number | null = null;

    for (const pattern of patterns) {
      const match = targetUrl.match(pattern);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
        break;
      }
    }

    if (lat === null || lng === null) {
      throw new BadRequestException(
        'Não foi possível extrair coordenadas válidas a partir do link fornecido. Verifique se o link contém um marcador ou ponto de mapa.',
      );
    }

    // Tenta obter o endereço formatado por geocodificação reversa
    const address = await this.reverseGeocode(lat, lng);

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: address || undefined,
      source: 'GOOGLE_MAPS_URL',
    };
  }

  /**
   * Geocodificação reversa usando OpenStreetMap Nominatim
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SetgenERP/1.0 (contato@setgen.com.br)',
        },
        timeout: 4000,
      });

      return response.data?.display_name || null;
    } catch {
      return null;
    }
  }

  /**
   * Geocodificação / Busca de endereços
   */
  async searchAddresses(query: string, city?: string): Promise<GeoLocationResult[]> {
    try {
      const fullQuery = city ? `${query}, ${city}` : query;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&limit=5`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SetgenERP/1.0 (contato@setgen.com.br)',
        },
        timeout: 4000,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        formattedAddress: item.display_name,
        source: 'NOMINATIM',
      }));
    } catch {
      return [];
    }
  }
}

