import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function richTextPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function richTextRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    const text = typeof control.value === 'string' ? richTextPlainText(control.value) : '';
    return text.length > 0 ? null : { richTextRequired: true };
  };
}