export const theme = {
  colors: {
    primary: '#2c3e50',
    secondary: '#3498db',
    accent: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    border: '#ecf0f1',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    fontWeight: {
      normal: 'normal' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: 'bold' as const,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;