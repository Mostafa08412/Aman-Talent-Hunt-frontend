import { Pipe, PipeTransform } from '@angular/core';

interface HumanizeOptions {
  abbreviations?: Record<string, string>;
}

const DEFAULT_ABBREVIATIONS: Record<string, string> = {
  JD: 'Job Description',
};

export function humanizeValue(value: string | null | undefined, options: HumanizeOptions = {}): string {
  if (value === null || value === undefined || value === '') return '';
  const abbreviations = { ...DEFAULT_ABBREVIATIONS, ...options.abbreviations };

  const words = String(value)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\s]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0);

  return words
    .map((word) => {
      const upper = word.toUpperCase();
      const abbreviation = abbreviations[upper];
      if (abbreviation) return abbreviation;
      if (word === upper && word.length <= 3) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

@Pipe({
  name: 'humanize',
  standalone: true,
})
export class HumanizePipe implements PipeTransform {
  transform(value: string | null | undefined, abbreviations?: Record<string, string>): string {
    return humanizeValue(value, abbreviations ? { abbreviations } : {});
  }
}