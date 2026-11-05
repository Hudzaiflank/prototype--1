const WIB_TIME_ZONE = "Asia/Jakarta";

const parseWibDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return new Date(value);

  const normalizedValue = value.trim();
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalizedValue);
  return new Date(
    hasTimeZone
      ? normalizedValue
      : `${normalizedValue.replace(" ", "T")}+07:00`,
  );
};

export const formatDate = (value) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: WIB_TIME_ZONE }).format(
    parseWibDate(value),
  );

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = parseWibDate(value);
  if (Number.isNaN(date.getTime())) return "-";
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
  return `${formattedDate} WIB`;
};

export const formatDateForFilename = (value) => {
  if (!value) return "tanpa-tanggal";
  const date = parseWibDate(value);
  if (Number.isNaN(date.getTime())) return "tanpa-tanggal";

  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};
