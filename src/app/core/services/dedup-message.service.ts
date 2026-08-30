import { Injectable } from '@angular/core';
import { MessageService, ToastMessageOptions } from 'primeng/api';

// Identical toasts within this window are collapsed into one — parallel failed requests,
// retried requests and repeated notifications should never stack up identical messages.
const DEDUP_WINDOW_MS = 3500;
const MAX_TRACKED = 64;

@Injectable()
export class DedupMessageService extends MessageService {
  private readonly recent = new Map<string, number>();

  override add(message: ToastMessageOptions): void {
    if (!message) return;

    const key = `${message.severity}|${message.summary}|${message.detail}`;
    const now = Date.now();
    if (now - (this.recent.get(key) ?? Number.NEGATIVE_INFINITY) < DEDUP_WINDOW_MS) {
      return;
    }

    this.recent.set(key, now);
    if (this.recent.size > MAX_TRACKED) {
      for (const [k, t] of this.recent) {
        if (now - t >= DEDUP_WINDOW_MS) this.recent.delete(k);
      }
    }

    super.add(message);
  }
}