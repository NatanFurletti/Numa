// Tema escuro do MVP (docs/SCREENS.md §1).
export const colors = {
  background: '#0F1115',
  surface: '#1A1D23',
  text: '#F5F6F8',
  textMuted: '#A3A8B3',
  accent: '#4F8CFF',
  success: '#3DD68C',
  warning: '#F5B544',
  error: '#FF6B6B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Coluna única centralizada no desktop.
export const maxContentWidth = 480;
