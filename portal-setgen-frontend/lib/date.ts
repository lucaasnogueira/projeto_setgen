/**
 * Datas do sistema no fuso da OPERAÇÃO, não no fuso de quem está olhando.
 *
 * Duas armadilhas motivam este arquivo:
 *
 * 1. `new Date('2026-08-08').toISOString()` interpreta a string como meia-noite
 *    UTC — que em Manaus é 20h do dia 7. O prazo vencia um dia antes do que o
 *    usuário digitou e voltava errado para o formulário.
 *
 * 2. Usar o fuso do navegador faz o MESMO orçamento aparecer com datas
 *    diferentes para quem abre de Manaus e de São Paulo, e diferente ainda da
 *    página pública (renderizada no servidor, que roda em UTC). Fixando o fuso
 *    do negócio, todo mundo — inclusive o cliente — vê a mesma data.
 *
 * O backend precisa usar o mesmo fuso: ver BUSINESS_TIME_ZONE no .env da API.
 */

export const BUSINESS_TIME_ZONE =
  process.env.NEXT_PUBLIC_BUSINESS_TIME_ZONE || 'America/Manaus';

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
  const corrected = timeZoneOffsetMs(new Date(naive - firstGuess), BUSINESS_TIME_ZONE);

  // Manaus não tem horário de verão, mas a segunda passada mantém o cálculo
  // correto se o fuso configurado tiver.
  return new Date(naive - corrected);
}

function parseDateInput(dateInput: string | null | undefined) {
  if (!dateInput) return null;
  const [year, month, day] = dateInput.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/** Date | ISO -> "YYYY-MM-DD" no fuso do negócio (para input type="date"). */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  // en-CA formata como YYYY-MM-DD, que é exatamente o que o input espera
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * "YYYY-MM-DD" -> ISO do ÚLTIMO instante daquele dia no fuso do negócio.
 * Use para prazos e validades: valem até o fim do dia escolhido.
 */
export function endOfBusinessDayISO(
  dateInput: string | null | undefined,
): string | undefined {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return undefined;

  return businessWallClockToInstant(
    parsed.year,
    parsed.month,
    parsed.day,
    23,
    59,
    59,
    999,
  ).toISOString();
}

/** "YYYY-MM-DD" -> ISO do PRIMEIRO instante daquele dia no fuso do negócio. */
export function startOfBusinessDayISO(
  dateInput: string | null | undefined,
): string | undefined {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return undefined;

  return businessWallClockToInstant(
    parsed.year,
    parsed.month,
    parsed.day,
    0,
    0,
    0,
    0,
  ).toISOString();
}

/** Exibição pt-BR no fuso do negócio. */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', { timeZone: BUSINESS_TIME_ZONE });
}

/** Exibição pt-BR com hora, no fuso do negócio. */
export function formatDateTimeBR(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { timeZone: BUSINESS_TIME_ZONE });
}
