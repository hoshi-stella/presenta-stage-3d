export function getPresentationPackageUrl(url = new URL(window.location.href)): string {
  return url.searchParams.get("presentation") ?? import.meta.env.VITE_PRESENTATION_URL ?? "/presentations/showcase.presentation.json";
}
