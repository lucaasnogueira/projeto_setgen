import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockLocationsService } from './stock-locations.service';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Stock Locations')
@Controller('stock-locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockLocationsController {
  constructor(private readonly stockLocationsService: StockLocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Cadastrar localização física de estoque' })
  create(@Body() dto: CreateStockLocationDto) {
    return this.stockLocationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar localizações físicas de estoque' })
  findAll() {
    return this.stockLocationsService.findAll();
  }
}
