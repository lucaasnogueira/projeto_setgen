import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientTaxonomiesService } from './client-taxonomies.service';
import { CreateClientTaxonomyDto } from './dto/create-client-taxonomy.dto';
import { UpdateClientTaxonomyDto } from './dto/update-client-taxonomy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ClientTaxonomyKind } from '@prisma/client';

@ApiTags('Client Taxonomies')
@ApiBearerAuth()
@Controller('client-taxonomies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientTaxonomiesController {
  constructor(private readonly clientTaxonomiesService: ClientTaxonomiesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar grupo ou segmento de cliente' })
  create(@Body() dto: CreateClientTaxonomyDto) {
    return this.clientTaxonomiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos/segmentos de cliente' })
  @ApiQuery({ name: 'kind', required: false, enum: ClientTaxonomyKind })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(
    @Query('kind') kind?: ClientTaxonomyKind,
    @Query('active') active?: string,
  ) {
    const filter = active === undefined ? undefined : active === 'true';
    return this.clientTaxonomiesService.findAll(kind, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id') id: string) {
    return this.clientTaxonomiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar' })
  update(@Param('id') id: string, @Body() dto: UpdateClientTaxonomyDto) {
    return this.clientTaxonomiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover' })
  remove(@Param('id') id: string) {
    return this.clientTaxonomiesService.remove(id);
  }
}
