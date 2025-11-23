import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { theme } from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
}) => {
  const getCardStyle = () => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      ...Platform.select({
        web: {
          boxShadow: shadow === 'sm'
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            : shadow === 'md'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            : 'none',
        },
        default: {},
      }),
    };

    const paddingStyles = {
      sm: { padding: theme.spacing.sm },
      md: { padding: theme.spacing.md },
      lg: { padding: theme.spacing.lg },
    };

    const shadowStyles = {
      none: {},
      sm: theme.shadows.sm,
      md: theme.shadows.md,
    };

    return [baseStyle, paddingStyles[padding], shadowStyles[shadow], style];
  };

  return (
    <View style={getCardStyle()}>
      {children}
    </View>
  );
};