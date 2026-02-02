import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveDto, RejectDto } from './dto/approve-reject.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar aprovação/rejeição (uso genérico)' })
  create(@Body() createApprovalDto: CreateApprovalDto, @Request() req) {
    return this.approvalsService.create(createApprovalDto, req.user.id);
  }

  @Post('approve/:serviceOrderId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Aprovar Ordem de Serviço' })
  approve(
    @Param('serviceOrderId') serviceOrderId: string,
    @Body() approveDto: ApproveDto,
    @Request() req,
  ) {
    return this.approvalsService.approve(
      serviceOrderId,
      approveDto,
      req.user.id,
    );
  }

  @Post('reject/:serviceOrderId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Rejeitar Ordem de Serviço' })
  reject(
    @Param('serviceOrderId') serviceOrderId: string,
    @Body() rejectDto: RejectDto,
    @Request() req,
  ) {
    return this.approvalsService.reject(serviceOrderId, rejectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as aprovações' })
  @ApiQuery({ name: 'serviceOrderId', required: false })
  @ApiQuery({ name: 'approverId', required: false })
  findAll(
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('approverId') approverId?: string,
  ) {
    return this.approvalsService.findAll({ serviceOrderId, approverId });
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar OS pendentes de aprovação' })
  findPendingApprovals() {
    return this.approvalsService.findPendingApprovals();
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter estatísticas de aprovações' })
  getStatistics() {
    return this.approvalsService.getApprovalStatistics();
  }

  @Get('service-order/:serviceOrderId')
  @ApiOperation({ summary: 'Buscar aprovações de uma OS específica' })
  findByServiceOrder(@Param('serviceOrderId') serviceOrderId: string) {
    return this.approvalsService.findByServiceOrder(serviceOrderId);
  }
}
