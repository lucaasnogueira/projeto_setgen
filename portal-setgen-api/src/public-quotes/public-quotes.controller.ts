import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { PublicQuotesService } from './public-quotes.service';

// Rota pública, sem guard: primeiro endpoint sem autenticação do projeto.
// Usa o próprio id do orçamento (UUID) como identificador não-adivinhável.
// Não expõe imagens (produto/logo) pois /uploads/* exige login.
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
}
