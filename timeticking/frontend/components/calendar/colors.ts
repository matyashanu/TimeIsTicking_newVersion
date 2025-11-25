import { Theme } from '@/components/ThemeProvider';

export type EventColorKey =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'grey';

export const EVENT_COLOR_OPTIONS: EventColorKey[] = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'grey',
];

export const PASTEL_COLORS: Record<Exclude<EventColorKey, 'default'>, string> = {
  red: '#F28B82',
  orange: '#F6BF26',
  yellow: '#FFF475',
  green: '#CCFF90',
  teal: '#A7FFEB',
  blue: '#CBF0F8',
  purple: '#D7AEFB',
  grey: '#E8EAED',
};

export const EVENT_COLOR_SWATCHES: Record<EventColorKey, string> = {
  default: 'var(--card-bg)',
  red: PASTEL_COLORS.red,
  orange: PASTEL_COLORS.orange,
  yellow: PASTEL_COLORS.yellow,
  green: PASTEL_COLORS.green,
  teal: PASTEL_COLORS.teal,
  blue: PASTEL_COLORS.blue,
  purple: PASTEL_COLORS.purple,
  grey: PASTEL_COLORS.grey,
};

const toRgba = (hex: string, alpha = 0.85) => {
  const value = hex.replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DEFAULT_BY_THEME: Record<Theme, { base: string; text: string; border: string }> = {
  dark: {
    base: '#243341',
    text: '#F5EFEB',
    border: 'rgba(245,239,235,0.45)',
  },
  light: {
    base: '#E6DED8',
    text: '#2F4156',
    border: 'rgba(47,65,86,0.45)',
  },
};

type EventColors = {
  background: string;
  color: string;
  border: string;
};

export function resolveEventColors(theme: Theme, color?: string | null): EventColors {
  if (!color || color === 'default') {
    const base = DEFAULT_BY_THEME[theme];
    return {
      background: toRgba(base.base, 0.85),
      color: base.text,
      border: `1px solid ${base.border}`,
    };
  }

  if ((color as EventColorKey) in PASTEL_COLORS) {
    const base = PASTEL_COLORS[color as Exclude<EventColorKey, 'default'>];
    return {
      background: toRgba(base, 0.85),
      color: '#2F4156',
      border: `1px solid ${toRgba(base, 0.45)}`,
    };
  }

  if (color.startsWith('#')) {
    return {
      background: toRgba(color, 0.85),
      color: '#2F4156',
      border: `1px solid ${toRgba(color, 0.45)}`,
    };
  }

  return resolveEventColors(theme, 'default');
}
