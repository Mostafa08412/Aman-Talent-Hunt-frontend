import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * Aman Way brand, ported from the intranet project's CSS variables into PrimeNG's
 * design-token system. Primary = teal (brand core), secondary use of the brand
 * orange is intentionally limited to the "warn" severity + a couple of accent
 * spots (see styles.scss .accent-bar) rather than a full color role — spreading
 * a second saturated hue across every severity reads as noisy in a dense ERP UI.
 *
 * Regenerate the primary/surface ramps at https://primeng.org/theming#colors
 * if the brand teal ever shifts — don't hand-edit only some of the steps.
 */
export const AmanPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eafbfa',
      100: '#ccf2ef',
      200: '#99e5e2',
      300: '#66d3ce',
      400: '#33c9c2',
      500: '#00b8b0', // brand core
      600: '#00a39c',
      700: '#008f88',
      800: '#00726c',
      900: '#005a55',
      950: '#003b38',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f6f9',
          100: '#f5fafa',
          200: '#e8f5f5',
          300: '#d0e8e7',
          400: '#bdd6d5',
          500: '#5a7a79',
          600: '#3d5f5e',
          700: '#1a3d3c',
          800: '#123130',
          900: '#0b2423',
          950: '#061716',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.800}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        surface: {
          0: '#0f3533',
          50: '#123a38',
          100: '#174f4d',
          200: '#1a5c5a',
          300: '#1f6a68',
          400: '#2a7d7a',
          500: '#4a9c99',
          600: '#66b3b0',
          700: '#99c8c7',
          800: '#cce3e2',
          900: '#e6f2f1',
          950: '#ffffff',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 85%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 75%)',
          color: 'rgba(255,255,255,.94)',
          focusColor: 'rgba(255,255,255,.94)',
        },
      },
    },
  },
});

/** The brand orange, kept out of the semantic token set on purpose — see note above. Used via var(--ath-accent). */
export const AMAN_ACCENT = '#f26522';
