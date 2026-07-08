import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateOilDto } from './dto/update-oil.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { FinishTripDto } from './dto/finish-trip.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Cadastrar veículo' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Listar veículos com status de óleo calculado' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('trips/open')
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Veículos em trânsito (na rua)' })
  findOpenTrips() {
    return this.vehiclesService.findOpenTrips();
  }

  @Get('trips')
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Histórico de saídas/retornos' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findTrips(
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.vehiclesService.findTrips({ vehicleId, driverId, from, to });
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Editar veículo' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Post(':id/photo')
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Enviar foto do veículo' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `vehicle-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
          return callback(new BadRequestException('Apenas imagens são permitidas'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }
    return this.vehiclesService.updatePhoto(id, file.path);
  }

  @Patch(':id/oil')
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Registrar troca de óleo / ajustar intervalo' })
  updateOil(@Param('id') id: string, @Body() dto: UpdateOilDto) {
    return this.vehiclesService.updateOil(id, dto);
  }

  @Post(':id/trips')
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Abrir saída (veículo vai pra rua)' })
  createTrip(@Param('id') id: string, @Body() dto: CreateTripDto, @Request() req) {
    return this.vehiclesService.createTrip(id, dto, req.user.id);
  }

  @Patch('trips/:tripId/finish')
  @RequiredPermissions(PERMISSIONS.FLEET_MANAGE)
  @ApiOperation({ summary: 'Finalizar saída (veículo retornou)' })
  finishTrip(@Param('tripId') tripId: string, @Body() dto: FinishTripDto) {
    return this.vehiclesService.finishTrip(tripId, dto);
  }
}
