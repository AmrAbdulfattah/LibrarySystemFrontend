/** ASP.NET's pageNumber is a positive Int32; invalid route values start at page one. */
export function routePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 2147483647 ? page : 1;
}
