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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CnpjService } from './cnpj.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ClientStatus } from '@prisma/client';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly cnpjService: CnpjService,
  ) {}

  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Consultar dados do CNPJ na API externa' })
  @ApiResponse({ status: 200, description: 'Dados do CNPJ retornados' })
  @ApiResponse({ status: 400, description: 'CNPJ inválido' })
  async fetchCnpj(@Param('cnpj') cnpj: string) {
    const data = await this.cnpjService.fetchCnpjData(cnpj);
    return this.cnpjService.formatCnpjData(data);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Criar novo cliente' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes (opcionalmente por status)' })
  @ApiQuery({ name: 'status', required: false, enum: ClientStatus })
  findAll(@Query('status') status?: ClientStatus) {
    return this.clientsService.findAll(status);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar clientes por texto' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string) {
    return this.clientsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/addresses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar endereço ao cliente' })
  addAddress(
    @Param('id') id: string,
    @Body() data: {
      label?: string;
      streetAddress: string;
      complement?: string;
      latitude?: number;
      longitude?: number;
      sourceExtraction?: string;
    },
  ) {
    return this.clientsService.addAddress(id, data);
  }

  @Delete('addresses/:addressId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover endereço do cliente' })
  deleteAddress(@Param('addressId') addressId: string) {
    return this.clientsService.deleteAddress(addressId);
  }

  @Post(':id/contacts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar contato corporativo ao cliente' })
  addContact(
    @Param('id') id: string,
    @Body() data: {
      contactType: string;
      value: string;
      label?: string;
      name?: string;
    },
  ) {
    return this.clientsService.addContact(id, data);
  }

  @Delete('contacts/:contactId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover contato corporativo do cliente' })
  deleteContact(@Param('contactId') contactId: string) {
    return this.clientsService.deleteContact(contactId);
  }
}
