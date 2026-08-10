/**
 * Reposiciona datas gravadas antes da correção de fuso.
 *
 * Antes, campos vindos de `<input type="date">` eram gravados como meia-noite
 * UTC. No fuso da operação (Manaus, UTC-4) isso é 20h do DIA ANTERIOR — então
 * uma despesa de 01/09 está gravada como 31/08, e um orçamento válido até
 * 08/08 vence às 20h do dia 07.
 *
 * O script detecta esses instantes (exatamente 00:00:00.000Z) e os move para a
 * posição correta dentro do dia que o usuário digitou:
 *
 *   - datas "de evento" (lançamento, competência, admissão) -> INÍCIO do dia
 *   - datas "de prazo"  (validade, vencimento)              -> FIM do dia
 *
 * Uso:
 *   npx ts-node prisma/scripts/fix-business-dates.ts            # dry-run
 *   npx ts-node prisma/scripts/fix-business-dates.ts --apply    # grava
 *
 * Idempotente: um instante já corrigido não é mais meia-noite UTC, então é
 * ignorado numa segunda execução.
 */
import { PrismaClient } from '@prisma/client';
import { BUSINESS_TIME_ZONE } from '../../src/common/date/business-date.util';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

/** Instante gravado pelo bug: exatamente meia-noite UTC. */
function looksLikeUtcMidnight(date: Date): boolean {
  return date.getUTCHours() === 0 && date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * O dia que o usuário DIGITOU é a data em UTC do instante gravado — porque o
 * bug era justamente interpretar "YYYY-MM-DD" como meia-noite UTC.
 */
function intendedDay(stored: Date) {
  return {
    year: stored.getUTCFullYear(),
    month: stored.getUTCMonth() + 1,
    day: stored.getUTCDate(),
  };
}

function businessInstant(
  y: number, mo: number, d: number,
  h: number, mi: number, s: number, ms: number,
): Date {
  const naive = Date.UTC(y, mo - 1, d, h, mi, s, ms);
  const g1 = timeZoneOffsetMs(new Date(naive), BUSINESS_TIME_ZONE);
  const g2 = timeZoneOffsetMs(new Date(naive - g1), BUSINESS_TIME_ZONE);
  return new Date(naive - g2);
}

const startOfDay = (stored: Date) => {
  const { year, month, day } = intendedDay(stored);
  return businessInstant(year, month, day, 0, 0, 0, 0);
};

const endOfDay = (stored: Date) => {
  const { year, month, day } = intendedDay(stored);
  return businessInstant(year, month, day, 23, 59, 59, 999);
};

type Position = 'start' | 'end';

interface Target {
  label: string;
  model: string;
  fields: { name: string; position: Position }[];
}

const TARGETS: Target[] = [
  {
    label: 'Orçamentos',
    model: 'quote',
    fields: [{ name: 'validUntil', position: 'end' }],
  },
  {
    label: 'Ordens de Compra',
    model: 'purchaseOrder',
    fields: [
      { name: 'issueDate', position: 'start' },
      { name: 'expiryDate', position: 'end' },
    ],
  },
  {
    label: 'Ordens de Serviço',
    model: 'serviceOrder',
    fields: [{ name: 'deadline', position: 'end' }],
  },
  {
    label: 'Entregas',
    model: 'delivery',
    fields: [{ name: 'deliveryDate', position: 'start' }],
  },
  {
    label: 'Garantias',
    model: 'warranty',
    fields: [
      { name: 'startDate', position: 'start' },
      { name: 'endDate', position: 'end' },
    ],
  },
  {
    label: 'Despesas',
    model: 'expense',
    fields: [
      { name: 'date', position: 'start' },
      { name: 'competenceDate', position: 'start' },
      { name: 'paymentDate', position: 'start' },
      { name: 'dueDate', position: 'end' },
    ],
  },
  {
    label: 'Colaboradores',
    model: 'employee',
    fields: [
      { name: 'birthDate', position: 'start' },
      { name: 'admissionDate', position: 'start' },
      { name: 'terminationDate', position: 'start' },
    ],
  },
  {
    label: 'ASOs',
    model: 'aSO',
    fields: [
      { name: 'examDate', position: 'start' },
      { name: 'expiryDate', position: 'end' },
    ],
  },
];

const fmt = (d: Date) =>
  `${d.toISOString()} (${d.toLocaleDateString('pt-BR', { timeZone: BUSINESS_TIME_ZONE })} em ${BUSINESS_TIME_ZONE})`;

async function main() {
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada será gravado) ===');
  console.log('Fuso da operação:', BUSINESS_TIME_ZONE, '\n');

  let grandTotal = 0;

  for (const target of TARGETS) {
    const delegate = (prisma as any)[target.model];
    if (!delegate) {
      console.log(`${target.label}: modelo "${target.model}" não existe — pulando`);
      continue;
    }

    const rows: any[] = await delegate.findMany({
      select: {
        id: true,
        ...Object.fromEntries(target.fields.map((f) => [f.name, true])),
      },
    });

    let changed = 0;
    const samples: string[] = [];

    for (const row of rows) {
      const patch: Record<string, Date> = {};

      for (const field of target.fields) {
        const value: Date | null = row[field.name];
        if (!value || !looksLikeUtcMidnight(value)) continue;

        const corrected =
          field.position === 'end' ? endOfDay(value) : startOfDay(value);
        patch[field.name] = corrected;

        if (samples.length < 3) {
          samples.push(`    ${field.name}: ${fmt(value)}\n              -> ${fmt(corrected)}`);
        }
      }

      if (Object.keys(patch).length === 0) continue;
      changed++;

      if (APPLY) {
        await delegate.update({ where: { id: row.id }, data: patch });
      }
    }

    grandTotal += changed;
    console.log(
      `${target.label}: ${changed} de ${rows.length} registro(s) ${APPLY ? 'corrigidos' : 'seriam corrigidos'}`,
    );
    if (samples.length) console.log(samples.join('\n'));
  }

  console.log(`\nTotal: ${grandTotal} registro(s).`);
  if (!APPLY && grandTotal > 0) {
    console.log('Rode de novo com --apply para gravar.');
  }
}

main()
  .catch((e) => {
    console.error('Falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
