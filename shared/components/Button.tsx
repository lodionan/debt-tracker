import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Platform } from 'react-native';
import { theme } from '../styles/theme';

type VariantType = 'primary' | 'secondary' | 'outline' | 'danger';
type SizeType = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: VariantType;
  size?: SizeType;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = (props: ButtonProps) => {
  const {
    title,
    onPress,
    variant = 'primary' as VariantType,
    size = 'md' as SizeType,
    disabled = false,
    loading = false,
    style,
    textStyle,
  } = props;

  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...Platform.select({
        web: {
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        },
        default: {},
      }),
    };

    const sizeStyles: Record<SizeType, ViewStyle> = {
      sm: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
      md: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
      lg: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
    };

    const variantStyles: Record<VariantType, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.danger,
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant], style];
  };

  const getTextStyle = () => {
    const baseTextStyle: TextStyle = {
      fontWeight: theme.typography.fontWeight.medium,
    };

    const sizeTextStyles: Record<SizeType, TextStyle> = {
      sm: { fontSize: theme.typography.fontSize.sm },
      md: { fontSize: theme.typography.fontSize.md },
      lg: { fontSize: theme.typography.fontSize.lg },
    };

    const variantTextStyles: Record<VariantType, TextStyle> = {
      primary: { color: theme.colors.surface },
      secondary: { color: theme.colors.surface },
      outline: { color: theme.colors.primary },
      danger: { color: theme.colors.surface },
    };

    return [baseTextStyle, sizeTextStyles[size], variantTextStyles[variant], textStyle];
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.primary : theme.colors.surface}
          style={{ marginRight: theme.spacing.sm }}
        />
      )}
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};