function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const raw = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function toCsv(rows, columns) {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(",")
  );
  return [header, ...body].join("\n");
}
