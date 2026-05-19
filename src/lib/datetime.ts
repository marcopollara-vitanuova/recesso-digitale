import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";

export function formatDateTimeRome(date: Date, timezone = "Europe/Rome"): string {
  return formatInTimeZone(date, timezone, "dd/MM/yyyy, HH:mm", { locale: it });
}

export function formatDateTimeEmail(date: Date, timezone = "Europe/Rome"): string {
  return `Data e ora richiesta: ${formatInTimeZone(date, timezone, "dd/MM/yyyy", { locale: it })}, ore ${formatInTimeZone(date, timezone, "HH:mm", { locale: it })}`;
}
