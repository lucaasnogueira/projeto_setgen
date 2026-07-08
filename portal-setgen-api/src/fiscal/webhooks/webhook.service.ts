import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookEventoTipo } from '@prisma/client';

interface WebhookPayload {
  evento:      WebhookEventoTipo;
  notaId:      string;
  numero:      string;
  status:      string;
  protocolo?:  string;
  chaveAcesso?: string;
  motivo?:     string;
  timestamp:   string;
  splitPayment?: Record<string, unknown>;
}

// Delays de retry: 5s, 15s, 60s
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000];

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly portalUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.portalUrl = this.config.get<string>('WEBHOOK_PORTAL_URL', 'http://localhost:3001/api/webhooks/fiscal');
  }

  /**
   * Dispara o webhook para o portal principal e registra o despacho no BD.
   * Utiliza retry automático com backoff exponencial em background.
   *
   * @param evento  – tipo do evento (NOTA_AUTORIZADA | NOTA_REJEITADA | NOTA_CANCELADA)
   * @param notaId  – ID da nota fiscal no banco de dados
   * @param payload – dados do evento
   */
  async dispatch(
    evento: WebhookEventoTipo,
    notaId: string,
    payload: Omit<WebhookPayload, 'evento' | 'timestamp'>,
  ): Promise<void> {
    const fullPayload: WebhookPayload = {
      ...payload,
      evento,
      timestamp: new Date().toISOString(),
    };

    // Registra despacho no BD
    const dispatch = await this.prisma.webhookDispatch.create({
      data: {
        notaId,
        evento,
        url:     this.portalUrl,
        payload: fullPayload as object,
      },
    });

    // Tenta enviar imediatamente
    await this.tentarEnvio(dispatch.id, fullPayload, 0);
  }

  /**
   * Reprocessa todos os webhooks que falharam e têm proxTentativa ≤ agora.
   * Chamar via CronJob a cada 2 minutos (ou via Bull Queue em produção).
   */
  async reprocessarPendentes(): Promise<void> {
    const pendentes = await this.prisma.webhookDispatch.findMany({
      where: {
        sucesso:      false,
        tentativas:   { lt: RETRY_DELAYS_MS.length + 1 },
        proxTentativa: { lte: new Date() },
      },
    });

    this.logger.log(`Reprocessando ${pendentes.length} webhook(s) pendente(s)`);

    for (const d of pendentes) {
      await this.tentarEnvio(d.id, d.payload as unknown as WebhookPayload, d.tentativas);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async tentarEnvio(
    dispatchId: string,
    payload: WebhookPayload,
    tentativaAtual: number,
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.portalUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'setgen-fiscal',
            'X-Event-Type':     payload.evento,
          },
          timeout: 10000,
        }),
      );

      await this.prisma.webhookDispatch.update({
        where: { id: dispatchId },
        data: {
          sucesso:     true,
          statusCode:  response.status,
          tentativas:  tentativaAtual + 1,
          proxTentativa: null,
        },
      });

      this.logger.log(`Webhook ${payload.evento} entregue com sucesso (status ${response.status})`);
    } catch (err) {
      const tentativas = tentativaAtual + 1;
      const proxDelay  = RETRY_DELAYS_MS[tentativas - 1];

      this.logger.warn(
        `Webhook ${payload.evento} falhou (tentativa ${tentativas}): ${err?.message}`,
      );

      await this.prisma.webhookDispatch.update({
        where: { id: dispatchId },
        data: {
          sucesso:       false,
          statusCode:    err?.response?.status ?? null,
          tentativas,
          proxTentativa: proxDelay
            ? new Date(Date.now() + proxDelay)
            : null,
        },
      });
    }
  }
}
