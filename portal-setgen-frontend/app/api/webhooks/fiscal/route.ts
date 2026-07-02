import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de Webhook para receber notificações do módulo fiscal.
 * O Backend (setgen-fiscal-api) dispara este endpoint para avisar sobre
 * autorização, rejeição ou cancelamento de notas.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const source = req.headers.get('x-webhook-source');
    const eventType = req.headers.get('x-event-type');

    console.log(`[Webhook Fiscal] Mensagem recebida de: ${source}`);
    console.log(`[Webhook Fiscal] Evento: ${eventType}`);
    console.log(`[Webhook Fiscal] Nota ID: ${payload.notaId} | Status: ${payload.status}`);

    // Aqui no futuro poderemos atualizar cache global ou disparar alertas em tempo real.
    // Por enquanto, apenas confirmamos o recebimento para evitar 404/retentativas no backend.

    return NextResponse.json({ 
      success: true, 
      receivedAt: new Date().toISOString() 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook Fiscal] Erro ao processar payload:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid payload' 
    }, { status: 400 });
  }
}
