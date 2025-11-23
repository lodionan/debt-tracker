import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { Client, Debt, Payment } from '../shared/types/common';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    summary: {
      todayRevenue: 0,
      monthRevenue: 0,
      totalOutstandingDebt: 0,
      activeClients: 0,
      totalClients: 0
    },
    recentPayments: [],
    topDebtors: [],
    paymentMethodDistribution: {},
    monthlyTrend: []
  });
  const [advancedKPIs, setAdvancedKPIs] = useState({
    revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
    averagePayment: { current: 0, lastMonth: 0 },
    collectionRate: 0,
    clients: { total: 0, active: 0, newThisMonth: 0 },
    paymentsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Cargar datos del dashboard desde la API
      const [dashboardResponse, kpisResponse] = await Promise.all([
        fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/dashboard/advanced-kpis', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())
      ]);

      setDashboardData(dashboardResponse);
      setAdvancedKPIs(kpisResponse);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // En caso de error, mostrar datos vacíos
      setDashboardData({
        summary: {
          todayRevenue: 0,
          monthRevenue: 0,
          totalOutstandingDebt: 0,
          activeClients: 0,
          totalClients: 0
        },
        recentPayments: [],
        topDebtors: [],
        paymentMethodDistribution: {},
        monthlyTrend: []
      });
      setAdvancedKPIs({
        revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
        averagePayment: { current: 0, lastMonth: 0 },
        collectionRate: 0,
        clients: { total: 0, active: 0, newThisMonth: 0 },
        paymentsThisMonth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const handleClientsManagement = () => {
    navigate('/clients');
  };

  const handleDebtsManagement = () => {
    navigate('/debts');
  };

  const handleReports = () => {
    navigate('/reports');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1f2937',
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
          <div>
            <h1 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: '#ffffff'
            }}>
              Panel de Administración
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Bienvenido, {user?.name}
            </span>
            <Button
              title="Cerrar Sesión"
              onPress={logout}
              variant="danger"
              size="sm"
            />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div style={{
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderBottomStyle: 'solid'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
            textAlign: 'center'
          }}>
            Estadísticas Generales
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.sm
              }}>
                {dashboardData.summary.totalClients}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Clientes Totales
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.warning,
                marginBottom: theme.spacing.sm
              }}>
                {dashboardData.summary.activeClients}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Clientes Activos
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.success,
                marginBottom: theme.spacing.sm
              }}>
                {formatCurrency(dashboardData.summary.monthRevenue)}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Ingresos del Mes
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.danger,
                marginBottom: theme.spacing.sm
              }}>
                {formatCurrency(dashboardData.summary.totalOutstandingDebt)}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Deuda Pendiente
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Advanced KPIs Section */}
      <div style={{
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderBottomStyle: 'solid'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
            textAlign: 'center'
          }}>
            KPIs Avanzados
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: advancedKPIs.revenue.growth >= 0 ? theme.colors.success : theme.colors.danger,
                marginBottom: theme.spacing.sm
              }}>
                {advancedKPIs.revenue.growth >= 0 ? '+' : ''}{advancedKPIs.revenue.growth.toFixed(1)}%
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Crecimiento Ingresos
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.sm
              }}>
                {advancedKPIs.collectionRate.toFixed(1)}%
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Tasa de Cobranza
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.sm
              }}>
                {formatCurrency(advancedKPIs.averagePayment.current)}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Pago Promedio
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.warning,
                marginBottom: theme.spacing.sm
              }}>
                {advancedKPIs.clients.newThisMonth}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Nuevos Clientes (Mes)
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: theme.spacing.xl
          }}>
            {/* Recent Payments */}
            <Card style={{
              padding: theme.spacing.xl
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.lg
              }}>
                Pagos Recientes
              </h3>
              <div style={{
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {dashboardData.recentPayments.length > 0 ? (
                  dashboardData.recentPayments.map((payment: any, index: number) => (
                    <div key={index} style={{
                      padding: theme.spacing.md,
                      borderBottom: index < dashboardData.recentPayments.length - 1 ?
                        `1px solid ${theme.colors.border}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text
                        }}>
                          {payment.clientName}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary
                        }}>
                          {formatDate(payment.paymentDate)}
                        </div>
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.success
                      }}>
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: theme.colors.textSecondary,
                    padding: theme.spacing.xl
                  }}>
                    No hay pagos recientes
                  </div>
                )}
              </div>
            </Card>

            {/* Top Debtors */}
            <Card style={{
              padding: theme.spacing.xl
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.lg
              }}>
                Mayores Deudores
              </h3>
              <div style={{
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {dashboardData.topDebtors.length > 0 ? (
                  dashboardData.topDebtors.map((debtor: any, index: number) => (
                    <div key={index} style={{
                      padding: theme.spacing.md,
                      borderBottom: index < dashboardData.topDebtors.length - 1 ?
                        `1px solid ${theme.colors.border}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text
                        }}>
                          {debtor.clientName}
                        </div>
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.danger
                      }}>
                        {formatCurrency(debtor.outstandingDebt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: theme.colors.textSecondary,
                    padding: theme.spacing.xl
                  }}>
                    No hay deudores pendientes
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Management Functions */}
      <div style={{
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg,
            textAlign: 'center'
          }}>
            Funciones de Administración
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }} onClick={handleClientsManagement}>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: theme.spacing.md,
                textAlign: 'center'
              }}>
                👥
              </div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.sm,
                textAlign: 'center'
              }}>
                Gestión de Clientes
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                Crear, editar y eliminar clientes del sistema
              </p>
            </div>

            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }} onClick={handleDebtsManagement}>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: theme.spacing.md,
                textAlign: 'center'
              }}>
                💰
              </div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.sm,
                textAlign: 'center'
              }}>
                Gestión de Deudas
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                Administrar deudas y controlar pagos pendientes
              </p>
            </div>

            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }} onClick={handleReports}>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: theme.spacing.md,
                textAlign: 'center'
              }}>
                📊
              </div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.sm,
                textAlign: 'center'
              }}>
                Reportes
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                Ver estadísticas y reportes mensuales detallados
              </p>
            </div>

            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }} onClick={handleSettings}>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                marginBottom: theme.spacing.md,
                textAlign: 'center'
              }}>
                ⚙️
              </div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.sm,
                textAlign: 'center'
              }}>
                Configuración
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: 0,
                textAlign: 'center',
                lineHeight: 1.5
              }}>
                Configurar parámetros del sistema y notificaciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;