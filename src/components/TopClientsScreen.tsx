import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { useNavigate } from 'react-router-dom';

interface TopClientData {
  client: {
    id: number;
    name: string;
    phone: string;
  };
  outstandingDebt: number;
  totalPaid: number;
  paymentsCount: number;
}

const TopClientsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [clientsData, setClientsData] = useState<TopClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadTopClients();
  }, [limit]);

  const loadTopClients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/top-clients?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClientsData(data);
      } else {
        console.error('Error loading top clients');
      }
    } catch (error) {
      console.error('Error loading top clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const handleViewClientDetails = (clientId: number) => {
    // Navigate to client details or debts management with filter
    navigate(`/clients?clientId=${clientId}`);
  };

  const handleExportReport = () => {
    // Trigger CSV download
    const link = document.createElement('a');
    link.href = `/api/reports/export/debts`;
    link.download = `top_clients_deudas_${new Date().toISOString().split('T')[0]}.csv`;
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
        Cargando top clientes...
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
                Top Clientes por Deuda
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: '#9ca3af',
                margin: theme.spacing.xs + ' 0 0 0'
              }}>
                Clientes con mayor deuda pendiente
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #4b5563',
                backgroundColor: '#374151',
                color: '#ffffff',
                fontSize: theme.typography.fontSize.sm
              }}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
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
        {/* Summary Stats */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                {clientsData.length}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Clientes con Deuda
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
                {formatCurrency(clientsData.reduce((sum, client) => sum + client.outstandingDebt, 0))}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Deuda Total
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
                {formatCurrency(clientsData.reduce((sum, client) => sum + client.totalPaid, 0))}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Total Pagado
              </div>
            </Card>
          </div>
        </section>

        {/* Clients List */}
        <section>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            Ranking de Clientes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {clientsData.map((clientData, index) => (
              <div
                key={clientData.client.id}
                style={{
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
                onClick={() => handleViewClientDetails(clientData.client.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.lg
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: '#ffffff'
                    }}>
                      {index + 1}
                    </div>

                    <div>
                      <h3 style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.text,
                        margin: 0,
                        marginBottom: theme.spacing.xs
                      }}>
                        {clientData.client.name}
                      </h3>
                      <p style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        margin: 0
                      }}>
                        📞 {clientData.client.phone}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.xl,
                    alignItems: 'center'
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Deuda Pendiente
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.danger
                      }}>
                        {formatCurrency(clientData.outstandingDebt)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Total Pagado
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.success
                      }}>
                        {formatCurrency(clientData.totalPaid)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.xs
                      }}>
                        Pagos
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.primary
                      }}>
                        {clientData.paymentsCount}
                      </div>
                    </div>

                    <div style={{
                      fontSize: theme.typography.fontSize.xl,
                      color: theme.colors.textSecondary
                    }}>
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {clientsData.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md
            }}>
              No hay clientes con deuda pendiente
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TopClientsScreen;