import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  totalClients: number;
  activeDebts: number;
  totalOutstandingDebt: number;
  monthlyRevenue: number;
  overdueDebts: number;
  recentPayments: any[];
  topDebtors: any[];
  paymentMethodDistribution: { [key: string]: number };
  monthlyTrend: any[];
  advancedKPIs: {
    revenue: { currentMonth: number; lastMonth: number; growth: number };
    averagePayment: { current: number; lastMonth: number };
    collectionRate: number;
    clients: { total: number; active: number; newThisMonth: number };
    paymentsThisMonth: number;
  };
}

const ReportsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Cargar datos reales desde las APIs del backend
      const [dashboardResponse, kpisResponse, performanceResponse, overdueResponse] = await Promise.all([
        fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/dashboard/advanced-kpis', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/dashboard/performance?days=30', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/reports/overdue-debts', {
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token')}`
           }
         }).then(res => res.json()).catch(() => ({ totalOverdueAmount: 0 })) // Fallback si falla
      ]);

      const reportData: ReportData = {
         totalClients: dashboardResponse.summary.totalClients,
         activeDebts: dashboardResponse.summary.activeClients,
         totalOutstandingDebt: dashboardResponse.summary.totalOutstandingDebt,
         monthlyRevenue: dashboardResponse.summary.monthRevenue,
         overdueDebts: overdueResponse.totalOverdueAmount || 0,
        recentPayments: dashboardResponse.recentPayments,
        topDebtors: dashboardResponse.topDebtors,
        paymentMethodDistribution: dashboardResponse.paymentMethodDistribution,
        monthlyTrend: performanceResponse.dailyMetrics || [],
        advancedKPIs: kpisResponse
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Error loading reports:', error);
      // En caso de error, mostrar datos en cero
      setReportData({
        totalClients: 0,
        activeDebts: 0,
        totalOutstandingDebt: 0,
        monthlyRevenue: 0,
        overdueDebts: 0,
        recentPayments: [],
        topDebtors: [],
        paymentMethodDistribution: {},
        monthlyTrend: [],
        advancedKPIs: {
          revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
          averagePayment: { current: 0, lastMonth: 0 },
          collectionRate: 0,
          clients: { total: 0, active: 0, newThisMonth: 0 },
          paymentsThisMonth: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const handleExportReport = () => {
    alert('Funcionalidad próximamente disponible');
  };

  const handleDetailedReport = (type: string) => {
    if (type === 'clientes nuevos' || type === 'deudas liquidadas') {
      // Navigate to monthly report for current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      navigate(`/reports/monthly?year=${year}&month=${month}`);
    } else if (type === 'monto total') {
      // Navigate to top clients report
      navigate('/reports/top-clients');
    } else if (type === 'rendimiento') {
      // Navigate to collection performance report
      navigate('/reports/collection-performance');
    } else if (type === 'metodos de pago') {
      // Navigate to payment methods analysis
      navigate('/reports/payment-methods');
    } else {
      alert(`Ver reporte detallado de ${type}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary
      }}>
        Cargando reportes...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1f2937',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderBottomStyle: 'solid',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            padding: theme.spacing.sm,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#3b82f6',
            fontSize: theme.typography.fontSize.md,
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
        <h1 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: '#ffffff',
          flex: 1,
          textAlign: 'center',
          margin: 0
        }}>
          Reportes y Estadísticas
        </h1>
        <Button
          title="📊 Exportar"
          onPress={handleExportReport}
          variant="primary"
          size="sm"
        />
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`
      }}>
        {/* Period Selector */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}>
          {[
            { key: 'daily', label: 'Diario' },
            { key: 'weekly', label: 'Semanal' },
            { key: 'monthly', label: 'Mensual' },
            { key: 'yearly', label: 'Anual' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              style={{
                flex: 1,
                padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: selectedPeriod === period.key ? '#3b82f6' : theme.colors.surface,
                color: selectedPeriod === period.key ? '#ffffff' : theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.md,
                fontWeight: selectedPeriod === period.key ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Main Statistics */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            Estadísticas Generales
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => handleDetailedReport('clientes')}
            >
              <div>
                <div style={{
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.xs
                }}>
                  {reportData?.totalClients}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  Clientes Totales
                </div>
              </div>
              <div style={{ fontSize: theme.typography.fontSize.xxl }}>👥</div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => handleDetailedReport('deudas activas')}
            >
              <div>
                <div style={{
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.warning,
                  marginBottom: theme.spacing.xs
                }}>
                  {reportData?.activeDebts}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  Deudas Activas
                </div>
              </div>
              <div style={{ fontSize: theme.typography.fontSize.xxl }}>💰</div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => handleDetailedReport('monto total')}
            >
              <div>
                <div style={{
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.success,
                  marginBottom: theme.spacing.xs
                }}>
                  {formatCurrency(reportData?.totalOutstandingDebt || 0)}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  Monto Total
                </div>
              </div>
              <div style={{ fontSize: theme.typography.fontSize.xxl }}>💵</div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => handleDetailedReport('pagos vencidos')}
            >
              <div>
                <div style={{
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.danger,
                  marginBottom: theme.spacing.xs
                }}>
                  {formatCurrency(reportData?.overdueDebts || 0)}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.fontWeight.medium
                }}>
                  Monto Vencido
                </div>
              </div>
              <div style={{ fontSize: theme.typography.fontSize.xxl }}>⚠️</div>
            </div>
          </div>
        </section>

        {/* Financial Summary */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            Resumen Financiero
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Pagos del Mes
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.xs
              }}>
                {formatCurrency(reportData?.advancedKPIs.paymentsThisMonth || 0)}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Pagos realizados este mes
              </div>
            </Card>

            <Card style={{
              padding: theme.spacing.xl
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Ingresos Mensuales
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.success,
                marginBottom: theme.spacing.xs
              }}>
                {formatCurrency(reportData?.monthlyRevenue || 0)}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Utilidad generada
              </div>
            </Card>
          </div>
        </section>

        {/* Advanced KPIs */}
        {reportData?.advancedKPIs && (
          <section style={{ marginBottom: theme.spacing.xl }}>
            <h2 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.lg
            }}>
              KPIs Avanzados
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: theme.spacing.lg
            }}>
              <Card style={{
                padding: theme.spacing.xl
              }}>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm
                }}>
                  Crecimiento de Ingresos
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: reportData.advancedKPIs.revenue.growth >= 0 ? theme.colors.success : theme.colors.danger,
                  marginBottom: theme.spacing.xs
                }}>
                  {reportData.advancedKPIs.revenue.growth >= 0 ? '+' : ''}{reportData.advancedKPIs.revenue.growth.toFixed(1)}%
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  vs mes anterior
                </div>
              </Card>

              <Card style={{
                padding: theme.spacing.xl
              }}>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm
                }}>
                  Tasa de Cobranza
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.xs
                }}>
                  {reportData.advancedKPIs.collectionRate.toFixed(1)}%
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  Eficiencia de cobro
                </div>
              </Card>

              <Card style={{
                padding: theme.spacing.xl
              }}>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm
                }}>
                  Pago Promedio
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.warning,
                  marginBottom: theme.spacing.xs
                }}>
                  {formatCurrency(reportData.advancedKPIs.averagePayment.current)}
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  Monto promedio por pago
                </div>
              </Card>

              <Card style={{
                padding: theme.spacing.xl
              }}>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm
                }}>
                  Nuevos Clientes
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent,
                  marginBottom: theme.spacing.xs
                }}>
                  {reportData.advancedKPIs.clients.newThisMonth}
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  Este mes
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Payment Method Distribution */}
        {reportData?.paymentMethodDistribution && Object.keys(reportData.paymentMethodDistribution).length > 0 && (
          <section style={{ marginBottom: theme.spacing.xl }}>
            <h2 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.lg
            }}>
              Distribución de Métodos de Pago
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: theme.spacing.lg
            }}>
              {Object.entries(reportData.paymentMethodDistribution).map(([method, count]) => (
                <Card key={method} style={{
                  padding: theme.spacing.xl
                }}>
                  <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.xl,
                    marginBottom: theme.spacing.sm
                  }}>
                    {method === 'CASH' ? '💵' : '💳'}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.xs
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    {method === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                  </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            Acciones Rápidas
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handleDetailedReport('clientes nuevos')}
            >
              <div style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text
              }}>
                📈 Clientes Nuevos
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handleDetailedReport('deudas liquidadas')}
            >
              <div style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text
              }}>
                ✅ Deudas Liquidadas
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handleDetailedReport('rendimiento')}
            >
              <div style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text
              }}>
                📊 Rendimiento Mensual
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handleDetailedReport('metodos de pago')}
            >
              <div style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text
              }}>
                💳 Análisis de Métodos de Pago
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReportsScreen;