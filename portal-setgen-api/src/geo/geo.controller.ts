import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { GeoService } from './geo.service';
import { ExtractUrlDto } from './dto/extract-url.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Post('extract-url')
  async extractUrl(@Body() dto: ExtractUrlDto) {
    return this.geoService.extractFromGoogleMapsUrl(dto.url);
  }

  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('city') city?: string,
  ) {
    return this.geoService.searchAddresses(query, city);
  }
}
