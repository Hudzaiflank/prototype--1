export const formatDate = (value) =>
  new Intl.DateTimeFormat("id-ID").format(new Date(value));
