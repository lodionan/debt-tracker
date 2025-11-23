import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { Debt, Client, Payment } from '../shared/types/common';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../services/api';

const DebtsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [archivedDebts, setArchivedDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadDebts();
    if (showArchived) {
      loadArchivedDebts();
    }
  }, [showArchived]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      console.log('Loading debts from:', apiUrl);

      // Cargar deudas activas desde la API
      const response = await fetch(`${apiUrl}/api/debts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const debtsData = await response.json();
      console.log('Active debts data received:', debtsData);
      setDebts(debtsData);
    } catch (error) {
      console.error('Error loading debts:', error);
      // En caso de error, mostrar lista vacía
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedDebts = async () => {
    try {
      const apiUrl = getApiUrl();
      console.log('Loading archived debts from:', apiUrl);

      // Cargar deudas archivadas desde la API
      const response = await fetch(`${apiUrl}/api/debts/archived`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const archivedDebtsData = await response.json();
      console.log('Archived debts data received:', archivedDebtsData);
      setArchivedDebts(archivedDebtsData);
    } catch (error) {
      console.error('Error loading archived debts:', error);
      setArchivedDebts([]);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    amount: '',
    dueDate: ''
  });
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'CASH' as 'CASH' | 'CARD',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof formData>>({});
  const [paymentFormErrors, setPaymentFormErrors] = useState<Partial<typeof paymentFormData>>({});
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const apiUrl = getApiUrl();
      console.log('Loading clients from:', apiUrl);

      // Cargar clientes reales desde la API
      const response = await fetch(`${apiUrl}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const clientsData = await response.json();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const handleAddDebt = () => {
    setShowAddModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<typeof formData> = {};

    if (!formData.clientId) {
      errors.clientId = 'Debe seleccionar un cliente';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.dueDate) {
      errors.dueDate = 'La fecha límite es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDebt = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const apiUrl = getApiUrl();
      console.log('Saving debt to:', apiUrl);

      // Crear deuda real en la API
      const response = await fetch(`${apiUrl}/api/debts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientId: parseInt(formData.clientId),
          amount: parseFloat(formData.amount),
          description: formData.description,
          dueDate: formData.dueDate
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response error:', errorText);
        throw new Error(`Error al crear deuda: ${response.status} - ${errorText}`);
      }

      // Recargar la lista de deudas para obtener los datos actualizados del servidor
      await loadDebts();

      setShowAddModal(false);
      setFormData({ clientId: '', description: '', amount: '', dueDate: '' });
      setFormErrors({});

      alert('Deuda agregada exitosamente');
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('Error al guardar la deuda');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setFormData({ clientId: '', description: '', amount: '', dueDate: '' });
    setFormErrors({});
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      clientId: debt.client?.id?.toString() || '',
      description: debt.description || '',
      amount: debt.amount?.toString() || '',
      dueDate: debt.dueDate || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!validateForm() || !editingDebt) return;

    setSaving(true);
    try {
      const apiUrl = getApiUrl();
      console.log('Updating debt at:', apiUrl);

      // Actualizar deuda real en la API
      const response = await fetch(`${apiUrl}/api/debts/${editingDebt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientId: parseInt(formData.clientId),
          amount: parseFloat(formData.amount),
          description: formData.description,
          dueDate: formData.dueDate
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response error:', errorText);
        throw new Error(`Error al actualizar deuda: ${response.status} - ${errorText}`);
      }

      // Recargar deudas para obtener datos actualizados del servidor
      await loadDebts();

      setShowEditModal(false);
      setEditingDebt(null);
      setFormData({ clientId: '', description: '', amount: '', dueDate: '' });
      setFormErrors({});

      alert('Deuda actualizada exitosamente');
    } catch (error: any) {
      console.error('Error updating debt:', error);
      alert('Error al actualizar la deuda: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingDebt(null);
    setFormData({ clientId: '', description: '', amount: '', dueDate: '' });
    setFormErrors({});
  };


  const handleArchiveDebt = async (debt: Debt) => {
    if (window.confirm(`¿Estás seguro de archivar la deuda "${debt.description}"?`)) {
      try {
        const apiUrl = getApiUrl();
        console.log('Archiving debt at:', apiUrl);

        // Archivar deuda real en la API
        const response = await fetch(`${apiUrl}/api/debts/${debt.id}/archive`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response status:', response.status);
          console.error('Response error:', errorText);
          throw new Error(`Error al archivar deuda: ${response.status} - ${errorText}`);
        }

        // Recargar las listas de deudas
        await loadDebts();
        if (showArchived) {
          await loadArchivedDebts();
        }

        alert('Deuda archivada exitosamente');
      } catch (error: any) {
        console.error('Error archiving debt:', error);
        alert('Error al archivar la deuda: ' + error.message);
      }
    }
  };

  const handleUnarchiveDebt = async (debt: Debt) => {
    if (window.confirm(`¿Estás seguro de restaurar la deuda "${debt.description}"?`)) {
      try {
        const apiUrl = getApiUrl();
        console.log('Unarchiving debt at:', apiUrl);

        // Restaurar deuda real en la API
        const response = await fetch(`${apiUrl}/api/debts/${debt.id}/unarchive`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response status:', response.status);
          console.error('Response error:', errorText);
          throw new Error(`Error al restaurar deuda: ${response.status} - ${errorText}`);
        }

        // Recargar las listas de deudas
        await loadDebts();
        if (showArchived) {
          await loadArchivedDebts();
        }

        alert('Deuda restaurada exitosamente');
      } catch (error: any) {
        console.error('Error unarchiving debt:', error);
        alert('Error al restaurar la deuda: ' + error.message);
      }
    }
  };

  const handleDeleteDebt = async (debt: Debt) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente la deuda "${debt.description}"? Esta acción no se puede deshacer.`)) {
      try {
        const apiUrl = getApiUrl();
        console.log('Deleting debt at:', apiUrl);

        // Eliminar deuda real de la API
        const response = await fetch(`${apiUrl}/api/debts/${debt.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response status:', response.status);
          console.error('Response error:', errorText);
          throw new Error(`Error al eliminar deuda: ${response.status} - ${errorText}`);
        }

        // Recargar las listas de deudas
        await loadDebts();
        if (showArchived) {
          await loadArchivedDebts();
        }

        alert('Deuda eliminada permanentemente');
      } catch (error: any) {
        console.error('Error deleting debt:', error);

        // Intentar extraer el mensaje de error del backend
        let errorMessage = 'Error desconocido';
        if (error.message) {
          try {
            // El error puede venir como JSON string
            const errorData = JSON.parse(error.message);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Si no es JSON, usar el mensaje directamente
            errorMessage = error.message;
          }
        }

        // Traducir mensajes específicos al español
        if (errorMessage.includes('Cannot delete debt with existing payments')) {
          alert('No se puede eliminar una deuda que ya tiene pagos registrados.');
        } else {
          alert('Error al eliminar la deuda: ' + errorMessage);
        }
      }
    }
  };

  const loadPayments = async (debtId: number) => {
    try {
      const apiUrl = getApiUrl();
      console.log('Loading payments from:', apiUrl);

      // Cargar pagos reales desde la API
      const response = await fetch(`${apiUrl}/api/payments/debt/${debtId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const paymentsData = await response.json();
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
  };

  const handleViewPayments = (debt: Debt) => {
    setSelectedDebt(debt);
    loadPayments(debt.id);
    setShowPaymentsModal(true);
  };

  const handleAddPayment = () => {
    setShowAddPaymentModal(true);
  };

  const handleClosePaymentsModal = () => {
    setShowPaymentsModal(false);
    setSelectedDebt(null);
    setPayments([]);
  };

  const handleCloseAddPaymentModal = () => {
    setShowAddPaymentModal(false);
    setPaymentFormData({ amount: '', paymentMethod: 'CASH', notes: '' });
    setPaymentFormErrors({});
  };

  const validatePaymentForm = (): boolean => {
    const errors: Partial<typeof paymentFormData> = {};

    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    }

    if (selectedDebt && parseFloat(paymentFormData.amount) > (selectedDebt.remainingAmount || selectedDebt.totalAmount || selectedDebt.amount || 0)) {
      errors.amount = 'El pago no puede ser mayor al restante de la deuda';
    }

    setPaymentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePayment = async () => {
    if (!validatePaymentForm() || !selectedDebt) return;

    setSavingPayment(true);
    try {
      const apiUrl = getApiUrl();
      console.log('Saving payment to:', apiUrl);

      // Crear pago real en la API
      const response = await fetch(`${apiUrl}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          debtId: selectedDebt.id,
          amount: parseFloat(paymentFormData.amount),
          paymentMethod: paymentFormData.paymentMethod,
          notes: paymentFormData.notes || undefined
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response error:', errorText);
        throw new Error(`Error al registrar pago: ${response.status} - ${errorText}`);
      }

      // Recargar pagos y deudas
      await loadPayments(selectedDebt.id);
      await loadDebts();

      setShowAddPaymentModal(false);
      setPaymentFormData({ amount: '', paymentMethod: 'CASH', notes: '' });
      setPaymentFormErrors({});

      alert('Pago registrado exitosamente');
    } catch (error: any) {
      console.error('Error saving payment:', error);
      alert('Error al registrar el pago: ' + error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0';
    return `$${amount.toLocaleString('es-MX')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Liquidada';
      case 'OVERDUE':
        return 'Vencida';
      default:
        return 'Activa';
    }
  };

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
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: '#ffffff',
            margin: 0,
            marginBottom: theme.spacing.xs
          }}>
            Gestión de Deudas
          </h1>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: theme.spacing.sm
          }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                borderRadius: theme.borderRadius.sm,
                border: 'none',
                backgroundColor: !showArchived ? '#3b82f6' : 'transparent',
                color: !showArchived ? '#ffffff' : '#d1d5db',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer'
              }}
            >
              Activas
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                borderRadius: theme.borderRadius.sm,
                border: 'none',
                backgroundColor: showArchived ? '#3b82f6' : 'transparent',
                color: showArchived ? '#ffffff' : '#d1d5db',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer'
              }}
            >
              Archivadas
            </button>
          </div>
        </div>
        {!showArchived && (
          <Button
            title="+ Agregar"
            onPress={handleAddDebt}
            variant="primary"
            size="sm"
          />
        )}
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary
          }}>
            Cargando deudas...
          </div>
        ) : (
          <div style={{ padding: `${theme.spacing.xl}px 0` }}>
            {showArchived ? (
              archivedDebts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing.xl,
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary
                }}>
                  No hay deudas archivadas
                </div>
              ) : (
                <div>
                  {archivedDebts.map((debt) => (
                  <Card key={debt.id} style={{
                    marginBottom: theme.spacing.lg,
                    padding: theme.spacing.xl
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: theme.spacing.sm
                        }}>
                          <h3 style={{
                            fontSize: theme.typography.fontSize.md,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.text,
                            margin: 0,
                            flex: 1
                          }}>
                            {debt.client.name} - {debt.client.phone}
                          </h3>
                          <span style={{
                            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            borderRadius: theme.borderRadius.lg,
                            backgroundColor: debt.status === 'PAID' ? '#d1fae5' : debt.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7',
                            color: debt.status === 'PAID' ? '#059669' : debt.status === 'OVERDUE' ? '#dc2626' : '#d97706'
                          }}>
                            {getStatusText(debt.status)}
                          </span>
                        </div>

                        {debt.description && (
                          <p style={{
                            fontSize: theme.typography.fontSize.md,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.sm
                          }}>
                            {debt.description}
                          </p>
                        )}

                        <div style={{ marginBottom: theme.spacing.sm }}>
                          <p style={{
                            fontSize: theme.typography.fontSize.md,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.text,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            Total: {formatCurrency(debt.totalAmount || debt.amount)}
                          </p>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.danger,
                            fontWeight: theme.typography.fontWeight.medium,
                            margin: 0
                          }}>
                            Restante: {formatCurrency(debt.remainingAmount || debt.totalAmount || debt.amount)}
                          </p>
                        </div>

                        <p style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.textSecondary,
                          margin: 0
                        }}>
                          📅 Creada: {formatDate(debt.createdAt)}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: theme.spacing.sm,
                        marginLeft: theme.spacing.md
                      }}>
                        <Button
                          title="Ver Pagos"
                          onPress={() => handleViewPayments(debt)}
                          variant="outline"
                          size="sm"
                        />
                        <Button
                          title="Editar"
                          onPress={() => handleEditDebt(debt)}
                          variant="secondary"
                          size="sm"
                        />
                        <Button
                          title="Eliminar"
                          onPress={() => handleDeleteDebt(debt)}
                          variant="danger"
                          size="sm"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                </div>
              )
            ) : (
              debts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing.xl,
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary
                }}>
                  No hay deudas registradas
                </div>
              ) : (
                <div>
                  {debts.map((debt) => (
                    <Card key={debt.id} style={{
                      marginBottom: theme.spacing.lg,
                      padding: theme.spacing.xl
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: theme.spacing.sm
                          }}>
                            <h3 style={{
                              fontSize: theme.typography.fontSize.md,
                              fontWeight: theme.typography.fontWeight.bold,
                              color: theme.colors.text,
                              margin: 0,
                              flex: 1
                            }}>
                              {debt.client.name} - {debt.client.phone}
                            </h3>
                            <span style={{
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.medium,
                              borderRadius: theme.borderRadius.lg,
                              backgroundColor: debt.status === 'PAID' ? '#d1fae5' : debt.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7',
                              color: debt.status === 'PAID' ? '#059669' : debt.status === 'OVERDUE' ? '#dc2626' : '#d97706'
                            }}>
                              {getStatusText(debt.status)}
                            </span>
                          </div>

                          {debt.description && (
                            <p style={{
                              fontSize: theme.typography.fontSize.md,
                              color: theme.colors.textSecondary,
                              margin: 0,
                              marginBottom: theme.spacing.sm
                            }}>
                              {debt.description}
                            </p>
                          )}

                          <div style={{ marginBottom: theme.spacing.sm }}>
                            <p style={{
                              fontSize: theme.typography.fontSize.md,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.text,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              Total: {formatCurrency(debt.totalAmount || debt.amount)}
                            </p>
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.danger,
                              fontWeight: theme.typography.fontWeight.medium,
                              margin: 0
                            }}>
                              Restante: {formatCurrency(debt.remainingAmount || debt.totalAmount || debt.amount)}
                            </p>
                          </div>

                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0
                          }}>
                            📅 Creada: {formatDate(debt.createdAt)}
                          </p>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: theme.spacing.sm,
                          marginLeft: theme.spacing.md
                        }}>
                          <Button
                            title="Ver Pagos"
                            onPress={() => handleViewPayments(debt)}
                            variant="outline"
                            size="sm"
                          />
                          <Button
                            title="Editar"
                            onPress={() => handleEditDebt(debt)}
                            variant="secondary"
                            size="sm"
                          />
                          <Button
                            title="Archivar"
                            onPress={() => handleArchiveDebt(debt)}
                            variant="secondary"
                            size="sm"
                          />
                          <Button
                            title="Eliminar"
                            onPress={() => handleDeleteDebt(debt)}
                            variant="danger"
                            size="sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Add Debt Modal */}
      {showAddModal && (
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
        }} onClick={handleCancelAdd}>
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              margin: 0,
              marginBottom: theme.spacing.lg,
              textAlign: 'center'
            }}>
              Agregar Nueva Deuda
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Client Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.clientId ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id.toString()}>
                      {client.name} - {client.phone}
                    </option>
                  ))}
                </select>
                {formErrors.clientId && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.clientId}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.description ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: Collar de plata, Anillos de oro, etc."
                />
                {formErrors.description && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.description}
                  </span>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Monto Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.amount ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0.00"
                />
                {formErrors.amount && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.amount}
                  </span>
                )}
              </div>

              {/* Due Date Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Fecha Límite *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.dueDate ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {formErrors.dueDate && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.dueDate}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              marginTop: theme.spacing.xl
            }}>
              <Button
                title="Cancelar"
                onPress={handleCancelAdd}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={saving ? "Guardando..." : "Guardar Deuda"}
                onPress={handleSaveDebt}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Debt Modal */}
      {showEditModal && editingDebt && (
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
        }} onClick={handleCancelEdit}>
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              margin: 0,
              marginBottom: theme.spacing.lg,
              textAlign: 'center'
            }}>
              Editar Deuda
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Client Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.clientId ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id.toString()}>
                      {client.name} - {client.phone}
                    </option>
                  ))}
                </select>
                {formErrors.clientId && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.clientId}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.description ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: Collar de plata, Anillos de oro, etc."
                />
                {formErrors.description && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.description}
                  </span>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Monto Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.amount ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0.00"
                />
                {formErrors.amount && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.amount}
                  </span>
                )}
              </div>

              {/* Due Date Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Fecha Límite *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.dueDate ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {formErrors.dueDate && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.dueDate}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              marginTop: theme.spacing.xl
            }}>
              <Button
                title="Cancelar"
                onPress={handleCancelEdit}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={saving ? "Guardando..." : "Actualizar Deuda"}
                onPress={handleSaveEdit}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {showPaymentsModal && selectedDebt && (
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
        }} onClick={handleClosePaymentsModal}>
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              paddingBottom: theme.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              borderBottomStyle: 'solid'
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text,
                margin: 0,
                textAlign: 'center'
              }}>
                Historial de Pagos
              </h2>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: `${theme.spacing.sm}px 0 0 0`,
                textAlign: 'center'
              }}>
                Deuda: {selectedDebt.description}
              </p>
            </div>

            <div style={{ padding: theme.spacing.lg }}>
              {payments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing.xl,
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary
                }}>
                  No hay pagos registrados para esta deuda
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {payments.map((payment) => (
                    <Card key={payment.id} style={{ padding: theme.spacing.md }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: theme.spacing.xs
                          }}>
                            <p style={{
                              fontSize: theme.typography.fontSize.lg,
                              fontWeight: theme.typography.fontWeight.bold,
                              color: theme.colors.primary,
                              margin: 0
                            }}>
                              ${payment.amount.toLocaleString('es-MX')}
                            </p>
                            <span style={{
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.medium,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: payment.paymentMethod === 'CASH' ? theme.colors.secondary : theme.colors.accent,
                              color: theme.colors.surface
                            }}>
                              {payment.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                            </span>
                          </div>

                          {payment.notes && (
                            <p style={{
                              fontSize: theme.typography.fontSize.md,
                              color: theme.colors.textSecondary,
                              margin: `${theme.spacing.xs}px 0`,
                              fontStyle: 'italic'
                            }}>
                              💬 {payment.notes}
                            </p>
                          )}

                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0
                          }}>
                            📅 {formatDate(payment.paymentDate)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Summary */}
                  <Card style={{
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderStyle: 'solid'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text
                      }}>
                        Total Pagado:
                      </span>
                      <span style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.success
                      }}>
                        ${payments.reduce((total, payment) => total + payment.amount, 0).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: theme.spacing.sm
                    }}>
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary
                      }}>
                        Número de pagos:
                      </span>
                      <span style={{
                        fontSize: theme.typography.fontSize.md,
                        color: theme.colors.text
                      }}>
                        {payments.length}
                      </span>
                    </div>
                  </Card>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: theme.spacing.xl
              }}>
                <Button
                  title="+ Agregar Pago"
                  onPress={handleAddPayment}
                  variant="primary"
                  size="md"
                />
                <Button
                  title="Cerrar"
                  onPress={handleClosePaymentsModal}
                  variant="outline"
                  size="md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && selectedDebt && (
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
        }} onClick={handleCloseAddPaymentModal}>
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text,
              margin: 0,
              marginBottom: theme.spacing.lg,
              textAlign: 'center'
            }}>
              Registrar Nuevo Pago
            </h2>

            <div style={{
              backgroundColor: theme.colors.background,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.sm,
              marginBottom: theme.spacing.lg
            }}>
              <p style={{
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                margin: 0,
                textAlign: 'center'
              }}>
                Deuda: <strong>{selectedDebt.description}</strong>
              </p>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: `${theme.spacing.xs}px 0 0 0`,
                textAlign: 'center'
              }}>
                Cliente: {selectedDebt.client.name} - {selectedDebt.client.phone}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Amount Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Monto del Pago *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={(selectedDebt.remainingAmount || selectedDebt.totalAmount || selectedDebt.amount || 0).toString()}
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${paymentFormErrors.amount ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0.00"
                />
                {paymentFormErrors.amount && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {paymentFormErrors.amount}
                  </span>
                )}
              </div>

              {/* Payment Method Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Método de Pago *
                </label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'CASH' | 'CARD' }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="CASH">💵 Efectivo</option>
                  <option value="CARD">💳 Tarjeta</option>
                </select>
              </div>

              {/* Notes Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Notas (opcional)
                </label>
                <textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              marginTop: theme.spacing.xl
            }}>
              <Button
                title="Cancelar"
                onPress={handleCloseAddPaymentModal}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={savingPayment ? "Registrando..." : "Registrar Pago"}
                onPress={handleSavePayment}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                disabled={savingPayment}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsManagement;