let Holidays: any

export async function loadHolidays() {
  if (!Holidays) {
    const mod = await import("date-holidays")
    Holidays = mod.default || mod
  }
  return Holidays
}