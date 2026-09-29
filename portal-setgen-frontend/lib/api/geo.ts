import api from './client';

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  source: 'GOOGLE_MAPS_URL' | 'HERE_MAPS' | 'FOURSQUARE' | 'NOMINATIM';
}

export const geoApi = {
  async extractUrl(url: string): Promise<GeoLocationResult> {
    const { data } = await api.post('/geo/extract-url', { url });
    return data;
  },

  async search(query: string, city?: string): Promise<GeoLocationResult[]> {
    const { data } = await api.get('/geo/search', { params: { query, city } });
    return data;
  },
};

