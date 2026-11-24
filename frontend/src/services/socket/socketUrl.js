export function socketNamespaceUrl(url, namespace) {
  const normalizedUrl = url.replace(/\/+$/, "");
  const suffix = `/${namespace}`;
  return normalizedUrl.endsWith(suffix)
    ? normalizedUrl
    : `${normalizedUrl}${suffix}`;
}
