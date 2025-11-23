import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { useNavigate } from 'react-router-dom';

interface PaymentMethodData {
  methodUsageCount: { [key: string]: number };
  methodUsageAmount: { [key: string]: number };
  mostPopularMethod: string;
  highestVolumeMethod: string;
  totalAmount: number;
  totalPayments: number;
}

const PaymentMethodsAnalysisScreen: React.FC = () => {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<PaymentMethodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // Default to last 3 months
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPaymentMethodsAnalysis();
  }, [startDate, endDate]);

  const loadPaymentMethodsAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/payment-methods-analysis?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
      } else {
        console.error('Error loading payment methods analysis');
      }
    } catch (error) {
      console.error('Error loading payment methods analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
  };

  const getMethodName = (method: string) => {
    return method === 'CASH' ? 'Efectivo' : 'Tarjeta';
  };

  const getMethodIcon = (method: string) => {
    return method === 'CASH' ? '💵' : '💳';
  };

  const handleExportReport = () => {
    // Trigger CSV download
    const link = document.createElement('a');
    link.href = `/api/reports/export/payments`;
    link.download = `analisis_metodos_pago_${new Date().toISOString().split('T')[0]}.csv`;
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
        Cargando análisis de métodos de pago...
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
                Análisis de Métodos de Pago
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af',
                margin: theme.spacing.xs + ' 0 0 0'
              }}>
                Preferencias y rendimiento por método de pago
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af'
              }}>
                Desde:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #4b5563',
                  backgroundColor: '#374151',
                  color: '#ffffff',
                  fontSize: theme.typography.fontSize.sm
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af'
              }}>
                Hasta:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #4b5563',
                  backgroundColor: '#374151',
                  color: '#ffffff',
                  fontSize: theme.typography.fontSize.sm
                }}
              />
            </div>
            <Button
              title="📊 Exportar CSV"
              onPress={handleExportReport}
              variant="primary"
              size="sm"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`
      }}>
        {analysisData && (
          <>
            {/* Summary Cards */}
            <section style={{ marginBottom: theme.spacing.xl }}>
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
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.sm
                  }}>
                    {analysisData.totalPayments}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Total de Pagos
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(analysisData.totalAmount)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Monto Total
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
                    {getMethodIcon(analysisData.mostPopularMethod)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Más Popular
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.md,
                    color: theme.colors.primary,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginTop: theme.spacing.xs
                  }}>
                    {getMethodName(analysisData.mostPopularMethod)}
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.accent,
                    marginBottom: theme.spacing.sm
                  }}>
                    {getMethodIcon(analysisData.highestVolumeMethod)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Mayor Volumen
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.md,
                    color: theme.colors.primary,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginTop: theme.spacing.xs
                  }}>
                    {getMethodName(analysisData.highestVolumeMethod)}
                  </div>
                </Card>
              </div>
            </section>

            {/* Methods Comparison */}
            <section style={{ marginBottom: theme.spacing.xl }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Comparación de Métodos de Pago
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: theme.spacing.lg
              }}>
                {Object.entries(analysisData.methodUsageCount).map(([method, count]) => {
                  const amount = analysisData.methodUsageAmount[method] || 0;
                  const countPercentage = formatPercentage(count, analysisData.totalPayments);
                  const amountPercentage = formatPercentage(amount, analysisData.totalAmount);

                  return (
                    <Card key={method} style={{ padding: theme.spacing.xl }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.lg,
                        marginBottom: theme.spacing.lg
                      }}>
                        <div style={{
                          fontSize: theme.typography.fontSize.xxl
                        }}>
                          {getMethodIcon(method)}
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.text,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            {getMethodName(method)}
                          </h3>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0
                          }}>
                            {count} pagos • {countPercentage} del total
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: theme.spacing.md
                      }}>
                        <div style={{
                          textAlign: 'center',
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.borderRadius.sm
                        }}>
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
                            color: theme.colors.textSecondary
                          }}>
                            Cantidad
                          </div>
                          <div style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xs
                          }}>
                            {countPercentage}
                          </div>
                        </div>

                        <div style={{
                          textAlign: 'center',
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.borderRadius.sm
                        }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.success,
                            marginBottom: theme.spacing.xs
                          }}>
                            {formatCurrency(amount)}
                          </div>
                          <div style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary
                          }}>
                            Monto
                          </div>
                          <div style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xs
                          }}>
                            {amountPercentage}
                          </div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div style={{ marginTop: theme.spacing.lg }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: theme.spacing.xs
                        }}>
                          <span style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary
                          }}>
                            Uso relativo
                          </span>
                          <span style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary
                          }}>
                            {countPercentage}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: 8,
                          backgroundColor: theme.colors.background,
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: countPercentage,
                            height: '100%',
                            backgroundColor: theme.colors.primary,
                            borderRadius: 4
                          }} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Detailed Breakdown Table */}
            <section>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Desglose Detallado
              </h2>

              <Card style={{ padding: 0 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: theme.spacing.lg,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text
                }}>
                  <div>Método de Pago</div>
                  <div style={{ textAlign: 'right' }}>Cantidad</div>
                  <div style={{ textAlign: 'right' }}>% Cantidad</div>
                  <div style={{ textAlign: 'right' }}>Monto</div>
                  <div style={{ textAlign: 'right' }}>% Monto</div>
                </div>

                {Object.entries(analysisData.methodUsageCount).map(([method, count]) => {
                  const amount = analysisData.methodUsageAmount[method] || 0;
                  const countPercentage = formatPercentage(count, analysisData.totalPayments);
                  const amountPercentage = formatPercentage(amount, analysisData.totalAmount);

                  return (
                    <div
                      key={method}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                        padding: theme.spacing.lg,
                        borderBottom: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.surface
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text
                      }}>
                        <span style={{ fontSize: theme.typography.fontSize.lg }}>
                          {getMethodIcon(method)}
                        </span>
                        {getMethodName(method)}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.primary
                      }}>
                        {count}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.textSecondary
                      }}>
                        {countPercentage}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.success
                      }}>
                        {formatCurrency(amount)}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.textSecondary
                      }}>
                        {amountPercentage}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PaymentMethodsAnalysisScreen;