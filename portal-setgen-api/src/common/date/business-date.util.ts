/**
 * Interpretação de datas no fuso da OPERAÇÃO, não no do servidor.
 *
 * Em produção a API roda em UTC. `new Date('2026-08-08')` é meia-noite UTC —
 * que em Manaus é 20h do dia 7. Toda data que chega como "YYYY-MM-DD" (campo
 * `<input type="date">`) virava o dia anterior no banco: despesa lançada no dia
 * errado, vencimento antecipado, admissão fora do mês.
 *
 * Precisa ser o mesmo fuso do frontend (NEXT_PUBLIC_BUSINESS_TIME_ZONE).
 */
export const BUSINESS_TIME_ZONE =
  process.env.BUSINESS_TIME_ZONE || 'America/Manaus';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Quanto o fuso está adiantado/atrasado em relação ao UTC naquele instante. */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  const wallClockAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );

  // as partes formatadas não têm milissegundos — compara no mesmo segundo
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Hora de parede no fuso do negócio -> instante absoluto. */
function businessWallClockToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second, ms);

  const firstGuess = timeZoneOffsetMs(new Date(naive), BUSINESS_TIME_ZONE);
  const corrected = timeZoneOffsetMs(
    new Date(naive - firstGuess),
    BUSINESS_TIME_ZONE,
  );

  // segunda passada mantém o cálculo correto em fusos com horário de verão
  return new Date(naive - corrected);
}

/**
 * Converte o que chega da API em Date.
 *
 * - "YYYY-MM-DD" (data pura, de input type="date") -> INÍCIO daquele dia no
 *   fuso do negócio. É o caso que estava quebrado.
 * - ISO completo com hora/offset -> passa direto: o cliente já disse
 *   exatamente qual instante quis (é o que os formulários de orçamento e OS
 *   fazem, mandando o fim do dia calculado no navegador).
 */
export function parseBusinessDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return businessWallClockToInstant(year, month, day, 0, 0, 0, 0);
  }

  return new Date(value);
}

/** Igual a parseBusinessDate, mas devolve undefined para valor ausente. */
export function parseOptionalBusinessDate(
  value: string | Date | null | undefined,
): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return parseBusinessDate(value);
}

/** "YYYY-MM-DD" -> FIM daquele dia no fuso do negócio (validades e prazos). */
export function parseBusinessDateEndOfDay(value: string | Date): Date {
  if (value instanceof Date) return value;

  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return businessWallClockToInstant(year, month, day, 23, 59, 59, 999);
  }

  return new Date(value);
}

/**
 * Soma meses sem estourar o fim do mês (31/01 + 1 mês = 28/02, não 03/03).
 * Tudo em UTC: a data é um instante, e usar getters locais faria o resultado
 * depender do fuso da máquina que rodou o cálculo.
 */
export function addMonthsUtc(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;

  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const result = new Date(date);
  result.setUTCFullYear(year);
  result.setUTCMonth(month, Math.min(date.getUTCDate(), lastDayOfTargetMonth));

  return result;
}

/** Soma dias corridos (UTC, sem depender do fuso da máquina). */
export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Soma anos sem estourar (29/02 + 1 ano = 28/02, não 01/03). */
export function addYearsUtc(date: Date, years: number): Date {
  return addMonthsUtc(date, years * 12);
}

/** "YYYY-MM" do instante, lido no fuso do negócio (mês de competência etc). */
export function businessYearMonth(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(instant);
}

/** "YYYY-MM-DD" do instante, lido no fuso do negócio. */
export function businessDay(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Formata no fuso do negócio (pt-BR). Use em documentos e relatórios. */
export function formatBusinessDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', { timeZone: BUSINESS_TIME_ZONE });
}
