import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { theme } from '../styles/theme';
import { Debt } from '../types/common';

interface DebtCardProps {
  debt: Debt;
  onPaymentPress: (debt: Debt) => void;
  onViewDetailsPress: (debt: Debt) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onPaymentPress,
  onViewDetailsPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return theme.colors.success;
      case 'OVERDUE':
        return theme.colors.danger;
      default:
        return theme.colors.warning;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.clientName}>{debt.client.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debt.status) }]}>
          <Text style={styles.statusText}>{debt.status}</Text>
        </View>
      </View>

      <Text style={styles.amount}>{formatCurrency(debt.amount)}</Text>
      <Text style={styles.description}>{debt.description}</Text>

      <View style={styles.details}>
        <Text style={styles.detailText}>Fecha límite: {formatDate(debt.dueDate)}</Text>
        <Text style={styles.detailText}>
          Pagos realizados: {debt.payments?.length || 0}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Ver Detalles"
          onPress={() => onViewDetailsPress(debt)}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
        {debt.status !== 'PAID' && (
          <Button
            title="Registrar Pago"
            onPress={() => onPaymentPress(debt)}
            variant="primary"
            size="sm"
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  clientName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.surface,
  },
  amount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  details: {
    marginBottom: theme.spacing.md,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});