import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    const activeBool = active !== undefined ? active === 'true' : undefined;
    return this.servicesService.findAll({ search, active: activeBool });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  async toggleActive(@Param('id') id: string) {
    return this.servicesService.toggleActive(id);
  }

  @Get(':id/templates')
  async getTemplates(@Param('id') id: string) {
    return this.servicesService.getTemplates(id);
  }

  @Post(':id/templates')
  async createTemplate(
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.servicesService.createTemplate(id, dto);
  }

  @Delete('templates/:templateId')
  async deleteTemplate(@Param('templateId') templateId: string) {
    return this.servicesService.deleteTemplate(templateId);
  }
}
