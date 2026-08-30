import { ApplicationSource } from '@core/models/enums';

/** URL-safe Base64 (no +, / or padding) so the source param stays opaque in URLs. */
function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Url(raw: string): string {
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const APPLICATION_SOURCES: ApplicationSource[] = [
  ApplicationSource.Wuzzuf,
  ApplicationSource.LinkedIn,
  ApplicationSource.Portal,
];

/** Encodes a source value into the reversible `src` query param. */
export function encodeApplicationSource(source: ApplicationSource): string {
  return encodeBase64Url(source);
}

/** Decodes the `src` query param back into a known source, or null when invalid. */
export function decodeApplicationSource(raw: string | null): ApplicationSource | null {
  if (!raw) return null;
  try {
    const decoded = decodeBase64Url(raw);
    return (Object.values(ApplicationSource) as string[]).includes(decoded)
      ? (decoded as ApplicationSource)
      : null;
  } catch {
    return null;
  }
}

/** Public apply link tagged with the source so the applicant's origin is detected. */
export function buildSourceLink(postId: string, source: ApplicationSource, origin = window.location.origin): string {
  return `${origin}/jobs/${postId}?src=${encodeApplicationSource(source)}`;
}