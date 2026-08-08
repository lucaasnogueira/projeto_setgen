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

  @Post('approve/:quoteId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Aprovar orçamento' })
  approve(@Param('quoteId') quoteId: string, @Body() dto: ApproveDto, @Request() req) {
    return this.approvalsService.approve(quoteId, dto, req.user.id, req.user.role);
  }

  @Post('reject/:quoteId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Rejeitar orçamento' })
  reject(@Param('quoteId') quoteId: string, @Body() dto: RejectDto, @Request() req) {
    return this.approvalsService.reject(quoteId, dto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as aprovações' })
  @ApiQuery({ name: 'quoteId', required: false })
  @ApiQuery({ name: 'approverId', required: false })
  findAll(
    @Query('quoteId') quoteId?: string,
    @Query('approverId') approverId?: string,
  ) {
    return this.approvalsService.findAll({ quoteId, approverId });
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar orçamentos pendentes de aprovação' })
  findPendingApprovals() {
    return this.approvalsService.findPendingApprovals();
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter estatísticas de aprovações' })
  getStatistics() {
    return this.approvalsService.getApprovalStatistics();
  }

  @Get('quote/:quoteId')
  @ApiOperation({ summary: 'Buscar aprovações de um orçamento específico' })
  findByQuote(@Param('quoteId') quoteId: string) {
    return this.approvalsService.findByQuote(quoteId);
  }
}
