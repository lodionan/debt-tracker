import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface MonthlyReportData {
  month: string;
  totalPayments: number;
  paymentsByMethod: { [key: string]: number };
  totalOutstandingDebt: number;
  clientsWithActiveDebts: number;
  totalNewDebt: number;
  newDebtsCount: number;
  settledDebtsCount: number;
  totalPaymentsCount: number;
}

const MonthlyReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get year and month from URL params, default to current month
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

  useEffect(() => {
    loadMonthlyReport();
  }, [year, month]);

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/monthly/${year}/${month}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Error loading monthly report');
      }
    } catch (error) {
      console.error('Error loading monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const getMonthName = (monthNum: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNum - 1];
  };

  const handleExportReport = () => {
    // Trigger CSV download
    const link = document.createElement('a');
    link.href = `/api/reports/export/debts`;
    link.download = `deudas_${year}_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        Cargando reporte mensual...
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
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <button
              onClick={() => navigate('/reports')}
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
            <div>
              <h1 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: '#ffffff',
                margin: 0
              }}>
                Reporte Mensual
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af',
                margin: theme.spacing.xs + ' 0 0 0'
              }}>
                {getMonthName(month)} {year}
              </p>
            </div>
          </div>
          <Button
            title="📊 Exportar CSV"
            onPress={handleExportReport}
            variant="primary"
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
        {reportData && (
          <>
            {/* Summary Cards */}
            <section style={{ marginBottom: theme.spacing.xl }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Resumen Ejecutivo
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: theme.spacing.lg
              }}>
                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(reportData.totalPayments)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Total Recaudado
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.sm
                  }}>
                    {reportData.totalPaymentsCount}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Pagos Realizados
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.warning,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(reportData.totalNewDebt)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Nuevas Deudas
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.danger,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(reportData.totalOutstandingDebt)}
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
            </section>

            {/* Payment Methods Breakdown */}
            {reportData.paymentsByMethod && Object.keys(reportData.paymentsByMethod).length > 0 && (
              <section style={{ marginBottom: theme.spacing.xl }}>
                <h2 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.lg
                }}>
                  Métodos de Pago
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: theme.spacing.lg
                }}>
                  {Object.entries(reportData.paymentsByMethod).map(([method, amount]) => (
                    <Card key={method} style={{ padding: theme.spacing.xl }}>
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
                          {formatCurrency(amount)}
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

            {/* Activity Summary */}
            <section>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Actividad del Mes
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: theme.spacing.lg
              }}>
                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Clientes con Deudas Activas
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.warning
                      }}>
                        {reportData.clientsWithActiveDebts}
                      </div>
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xxl }}>👥</div>
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Nuevas Deudas Creadas
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.primary
                      }}>
                        {reportData.newDebtsCount}
                      </div>
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xxl }}>📝</div>
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Deudas Liquidadas
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.success
                      }}>
                        {reportData.settledDebtsCount}
                      </div>
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xxl }}>✅</div>
                  </div>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MonthlyReportScreen;