import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService, Debt } from '../services/debt';
import { paymentService, Payment } from '../services/payment';
import { Card } from 'shared/components/Card';
import { Button } from 'shared/components/Button';
import { theme } from 'shared/styles/theme';

const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const debtsData = await debtService.getAllDebts();
      setDebts(debtsData);
    } catch (error) {
      console.error('Error loading debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (debtId: number) => {
    try {
      const paymentsData = await paymentService.getPaymentsByDebt(debtId);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleViewPayments = (debt: Debt) => {
    setSelectedDebt(debt);
    loadPayments(debt.id);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const activeDebts = debts.filter(debt => debt.status === 'ACTIVE');
  const settledDebts = debts.filter(debt => debt.status === 'PAID');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header style={{
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ alignItems: 'center' }}>
            <h1 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              margin: 0,
              marginBottom: theme.spacing.xs
            }}>
              💰 Miry
            </h1>
            <p style={{
              fontSize: theme.typography.fontSize.md,
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Panel de Cliente
            </p>
          </div>
          <Button
            title="Salir"
            onPress={logout}
            variant="outline"
            size="sm"
          />
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`
      }}>
        <div style={{ padding: `${theme.spacing.xl}px 0` }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              fontSize: theme.typography.fontSize.md,
              color: theme.colors.textSecondary
            }}>
              Cargando...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
              {/* Statistics */}
              <Card>
                <div style={{ padding: theme.spacing.lg }}>
                  <h3 style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text,
                    margin: 0,
                    marginBottom: theme.spacing.lg
                  }}>
                    Mis Estadísticas
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: theme.spacing.md
                  }}>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
                      <p style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.primary,
                        margin: 0,
                        marginBottom: theme.spacing.xs
                      }}>
                        {formatCurrency(debts.reduce((total, debt) => total + (debt.amount || 0), 0))}
                      </p>
                      <p style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        margin: 0
                      }}>
                        Deuda Total
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
                      <p style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.success,
                        margin: 0,
                        marginBottom: theme.spacing.xs
                      }}>
                        {formatCurrency(debts.reduce((total, debt) => total + ((debt.amount || 0) - (debt.remainingAmount || 0)), 0))}
                      </p>
                      <p style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        margin: 0
                      }}>
                        Pagado
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
                      <p style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.danger,
                        margin: 0,
                        marginBottom: theme.spacing.xs
                      }}>
                        {formatCurrency(debts.reduce((total, debt) => total + (debt.remainingAmount || 0), 0))}
                      </p>
                      <p style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        margin: 0
                      }}>
                        Pendiente
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Active Debts */}
              <Card>
                <div style={{
                  padding: theme.spacing.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                  borderBottomStyle: 'solid'
                }}>
                  <h3 style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text,
                    margin: 0
                  }}>
                    Deudas Activas
                  </h3>
                </div>
                {activeDebts.length === 0 ? (
                  <div style={{
                    padding: theme.spacing.lg,
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.md,
                    color: theme.colors.textSecondary
                  }}>
                    No tienes deudas activas
                  </div>
                ) : (
                  <div>
                    {activeDebts.map((debt) => (
                      <div key={debt.id} style={{
                        padding: theme.spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        borderBottomStyle: 'solid',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: theme.typography.fontSize.md,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            {debt.description || 'Sin descripción'}
                          </h4>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            Total: {formatCurrency(debt.amount)}
                          </p>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            Restante: {formatCurrency(debt.remainingAmount)}
                          </p>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0
                          }}>
                            Creada: {formatDate(debt.createdAt)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                          <Button
                            title="Ver Pagos"
                            onPress={() => handleViewPayments(debt)}
                            variant="secondary"
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Settled Debts */}
              {settledDebts.length > 0 && (
                <Card>
                  <div style={{
                    padding: theme.spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    borderBottomStyle: 'solid'
                  }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text,
                      margin: 0
                    }}>
                      Deudas Liquidadas
                    </h3>
                  </div>
                  <div>
                    {settledDebts.map((debt) => (
                      <div key={debt.id} style={{
                        padding: theme.spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        borderBottomStyle: 'solid',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: theme.typography.fontSize.md,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            {debt.description || 'Sin descripción'}
                          </h4>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            Total: {formatCurrency(debt.amount)}
                          </p>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.success,
                            fontWeight: theme.typography.fontWeight.medium,
                            margin: 0
                          }}>
                            Liquidada
                          </p>
                        </div>
                        <Button
                          title="Ver Historial"
                          onPress={() => handleViewPayments(debt)}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <Button
                  title="Ver Todas las Deudas"
                  onPress={() => alert('Funcionalidad próximamente')}
                  variant="primary"
                  size="md"
                />
                <Button
                  title="Historial de Pagos"
                  onPress={() => alert('Funcionalidad próximamente')}
                  variant="outline"
                  size="md"
                />
              </div>

              {/* Payment History Modal */}
              {selectedDebt && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }} onClick={() => setSelectedDebt(null)}>
                  <div style={{
                    maxWidth: 600,
                    width: '90%'
                  }} onClick={(e: any) => e.stopPropagation()}>
                    <Card>
                    <div style={{
                      padding: theme.spacing.lg,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      borderBottomStyle: 'solid'
                    }}>
                      <h3 style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text,
                        margin: 0
                      }}>
                        Historial de Pagos - {selectedDebt.description || 'Deuda'}
                      </h3>
                    </div>
                    <div style={{ padding: theme.spacing.lg }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                        {payments.map((payment) => (
                          <Card key={payment.id} style={{ padding: theme.spacing.md }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start'
                            }}>
                              <div>
                                <p style={{
                                  fontSize: theme.typography.fontSize.md,
                                  fontWeight: theme.typography.fontWeight.medium,
                                  color: theme.colors.text,
                                  margin: 0,
                                  marginBottom: theme.spacing.xs
                                }}>
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p style={{
                                  fontSize: theme.typography.fontSize.sm,
                                  color: theme.colors.textSecondary,
                                  margin: 0,
                                  marginBottom: theme.spacing.xs
                                }}>
                                  Método: {payment.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                                </p>
                                {payment.notes && (
                                  <p style={{
                                    fontSize: theme.typography.fontSize.sm,
                                    color: theme.colors.textSecondary,
                                    margin: 0
                                  }}>
                                    Notas: {payment.notes}
                                  </p>
                                )}
                              </div>
                              <span style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textSecondary
                              }}>
                                {formatDate(payment.paymentDate)}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: theme.spacing.lg
                      }}>
                        <Button
                          title="Cerrar"
                          onPress={() => setSelectedDebt(null)}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;