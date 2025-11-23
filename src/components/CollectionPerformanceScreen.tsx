import React, { useState, useEffect } from 'react';
import { Card } from 'shared/components/Card';
import { Button } from 'shared/components/Button';
import { theme } from 'shared/styles/theme';
import { useNavigate } from 'react-router-dom';

interface CollectionData {
  totalCollections: number;
  monthlyCollections: Array<{
    month: string;
    amount: number;
  }>;
  averageGrowthRate: number;
  totalPayments: number;
}

const CollectionPerformanceScreen: React.FC = () => {
  const navigate = useNavigate();
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    loadCollectionPerformance();
  }, [months]);

  const loadCollectionPerformance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/collection-performance?months=${months}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollectionData(data);
      } else {
        console.error('Error loading collection performance');
      }
    } catch (error) {
      console.error('Error loading collection performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
  };

  const handleExportReport = () => {
    // Trigger CSV download
    const link = document.createElement('a');
    link.href = `/api/reports/export/payments`;
    link.download = `rendimiento_cobranza_${new Date().toISOString().split('T')[0]}.csv`;
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
        Cargando rendimiento de cobranza...
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
                Rendimiento de Cobranza
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af',
                margin: theme.spacing.xs + ' 0 0 0'
              }}>
                Análisis de tendencias de cobro
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              style={{
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #4b5563',
                backgroundColor: '#374151',
                color: '#ffffff',
                fontSize: theme.typography.fontSize.sm
              }}
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </select>
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
        {collectionData && (
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
                    color: theme.colors.success,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(collectionData.totalCollections)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Total Recaudado ({months} meses)
                  </div>
                </Card>

                <Card style={{ padding: theme.spacing.xl }}>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: collectionData.averageGrowthRate >= 0 ? theme.colors.success : theme.colors.danger,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatPercentage(collectionData.averageGrowthRate)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Crecimiento Promedio
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
                    {collectionData.totalPayments}
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
                    color: theme.colors.warning,
                    marginBottom: theme.spacing.sm
                  }}>
                    {collectionData.monthlyCollections.length > 0 ?
                      formatCurrency(collectionData.totalCollections / collectionData.monthlyCollections.length) :
                      '$0'
                    }
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    Promedio Mensual
                  </div>
                </Card>
              </div>
            </section>

            {/* Monthly Trend Chart */}
            <section style={{ marginBottom: theme.spacing.xl }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Tendencia Mensual de Cobranza
              </h2>

              <Card style={{ padding: theme.spacing.xl }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: theme.spacing.md,
                  minHeight: 300,
                  padding: theme.spacing.lg
                }}>
                  {collectionData.monthlyCollections.map((monthData, index) => {
                    const maxAmount = Math.max(...collectionData.monthlyCollections.map(m => m.amount));
                    const height = maxAmount > 0 ? (monthData.amount / maxAmount) * 200 : 0;

                    return (
                      <div
                        key={monthData.month}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1
                        }}
                      >
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.primary,
                          marginBottom: theme.spacing.xs,
                          textAlign: 'center'
                        }}>
                          {formatCurrency(monthData.amount)}
                        </div>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: 60,
                            height: Math.max(height, 20),
                            backgroundColor: index === collectionData.monthlyCollections.length - 1 ?
                              theme.colors.primary : theme.colors.surface,
                            border: `2px solid ${theme.colors.border}`,
                            borderRadius: `${theme.borderRadius.sm}px ${theme.borderRadius.sm}px 0 0`,
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                        >
                          {index === collectionData.monthlyCollections.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              top: -25,
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.primary,
                              fontWeight: theme.typography.fontWeight.bold
                            }}>
                              Actual
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          marginTop: theme.spacing.sm,
                          textAlign: 'center',
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'center',
                          width: 60
                        }}>
                          {getMonthName(monthData.month)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>

            {/* Monthly Details Table */}
            <section>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Detalle por Mes
              </h2>

              <Card style={{ padding: 0 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  padding: theme.spacing.lg,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text
                }}>
                  <div>Mes</div>
                  <div style={{ textAlign: 'right' }}>Monto Recaudado</div>
                  <div style={{ textAlign: 'right' }}>Variación</div>
                </div>

                {collectionData.monthlyCollections.map((monthData, index) => {
                  const previousAmount = index > 0 ? collectionData.monthlyCollections[index - 1].amount : 0;
                  const variation = previousAmount > 0 ? ((monthData.amount - previousAmount) / previousAmount) * 100 : 0;

                  return (
                    <div
                      key={monthData.month}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        padding: theme.spacing.lg,
                        borderBottom: index < collectionData.monthlyCollections.length - 1 ?
                          `1px solid ${theme.colors.border}` : 'none',
                        backgroundColor: index % 2 === 0 ? theme.colors.background : theme.colors.surface
                      }}
                    >
                      <div style={{
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text
                      }}>
                        {getMonthName(monthData.month)}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.success
                      }}>
                        {formatCurrency(monthData.amount)}
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: theme.typography.fontWeight.medium,
                        color: variation >= 0 ? theme.colors.success : theme.colors.danger
                      }}>
                        {index > 0 ? formatPercentage(variation) : '-'}
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

export default CollectionPerformanceScreen;