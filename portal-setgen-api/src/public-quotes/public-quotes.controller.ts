import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { PublicQuotesService } from './public-quotes.service';

@ApiTags('Public Quotes')
@Controller('public/quotes')
export class PublicQuotesController {
  constructor(private readonly publicQuotesService: PublicQuotesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Visualizar orçamento (página pública, sem autenticação)' })
  async getQuote(@Param('id') id: string, @Res() res: Response) {
    const html = await this.publicQuotesService.renderQuoteHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aprovação pública do orçamento pelo cliente' })
  async acceptQuote(
    @Param('id') id: string,
    @Body() body: { signatoryName: string; signatoryDoc?: string; comments?: string },
  ) {
    return this.publicQuotesService.acceptPublicQuote(
      id,
      body.signatoryName || 'Cliente',
      body.signatoryDoc,
      body.comments,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Recusa ou solicitação de revisão pública pelo cliente' })
  async rejectQuote(
    @Param('id') id: string,
    @Body() body: { clientName?: string; reason?: string },
  ) {
    return this.publicQuotesService.rejectPublicQuote(
      id,
      body.clientName || 'Cliente',
      body.reason || 'Sem motivo informado',
    );
  }
}
