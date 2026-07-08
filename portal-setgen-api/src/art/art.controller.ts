import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ArtService } from './art.service';
import { CreateArtDto } from './dto/create-art.dto';
import { UpdateArtDto } from './dto/update-art.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';

const artFileInterceptor = FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads/art',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `art-${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

@ApiTags('ART')
@Controller('art')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.ART_MANAGE)
  @ApiOperation({ summary: 'Emitir ART vinculada a uma Ordem de Serviço aprovada' })
  @UseInterceptors(artFileInterceptor)
  @ApiConsumes('multipart/form-data')
  create(@Body() dto: CreateArtDto, @UploadedFile() file?: Express.Multer.File) {
    return this.artService.create(dto, file?.path);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.ART_VIEW, PERMISSIONS.ART_MANAGE)
  @ApiOperation({ summary: 'Listar todas as ARTs emitidas' })
  findAll() {
    return this.artService.findAll();
  }

  @Get('service-order/:serviceOrderId')
  @RequiredPermissions(PERMISSIONS.ART_VIEW, PERMISSIONS.ART_MANAGE)
  @ApiOperation({ summary: 'Buscar ART de uma Ordem de Serviço' })
  findByServiceOrder(@Param('serviceOrderId') serviceOrderId: string) {
    return this.artService.findByServiceOrder(serviceOrderId);
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.ART_VIEW, PERMISSIONS.ART_MANAGE)
  @ApiOperation({ summary: 'Buscar ART por ID' })
  findOne(@Param('id') id: string) {
    return this.artService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.ART_MANAGE)
  @UseInterceptors(artFileInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Atualizar ART' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArtDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.artService.update(id, dto, file?.path);
  }

  @Delete(':id')
  @RequiredPermissions(PERMISSIONS.ART_MANAGE)
  @ApiOperation({ summary: 'Remover ART' })
  remove(@Param('id') id: string) {
    return this.artService.remove(id);
  }
}
