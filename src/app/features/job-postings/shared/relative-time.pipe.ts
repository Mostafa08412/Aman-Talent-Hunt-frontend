import { Pipe, PipeTransform } from '@angular/core';

/** Renders "just now", "5m ago", "2d ago" from an ISO/UTC timestamp. */
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';

    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '—';

    const seconds = Math.floor((Date.now() - then) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
  }
}
