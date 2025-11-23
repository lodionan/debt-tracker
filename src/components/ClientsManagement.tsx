import React, { useState, useEffect } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { Client } from '../shared/types/common';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../services/api';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  productName?: string;
  totalAmount?: string;
  downPayment?: string;
}

const ClientsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    productName: '',
    totalAmount: '',
    downPayment: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<ClientFormData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, [activeTab]);


  const loadClients = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();

      console.log('ClientsManagement - API URL:', apiUrl);
      console.log('ClientsManagement - Hostname:', window.location.hostname);
      console.log('ClientsManagement - Protocol:', window.location.protocol);

      // Cargar clientes reales desde la API usando la URL configurada
      const response = await fetch(`${apiUrl}/api/clients`, {
        method: 'GET',
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
      console.log('ClientsManagement - Clients loaded:', clientsData.length);

      // Si estamos en la pestaña de archivados, también cargar clientes archivados
      let archivedClientsData = [];
      if (activeTab === 'archived') {
        try {
          console.log('ClientsManagement - Loading archived clients...');
          const archivedResponse = await fetch(`${apiUrl}/api/clients/archived`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
          });

          if (archivedResponse.ok) {
            archivedClientsData = await archivedResponse.json();
            console.log('ClientsManagement - Archived clients loaded:', archivedClientsData.length);
          } else {
            console.log('ClientsManagement - No archived clients endpoint available');
          }
        } catch (error) {
          console.error('Error loading archived clients:', error);
        }
      }

      // Combinar clientes activos y archivados
      const allClients = [...clientsData, ...archivedClientsData];
      console.log('ClientsManagement - Total clients:', allClients.length);
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      // En caso de error, mostrar lista vacía
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setShowAddModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<ClientFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Teléfono debe tener 10 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClient = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const apiUrl = getApiUrl();

      console.log('SaveClient - API URL:', apiUrl);
      console.log('SaveClient - Request data:', {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address || undefined
      });

      // Crear cliente real en la API
      const response = await fetch(`${apiUrl}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone,
          address: formData.address || undefined
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response error:', errorText);
        throw new Error(`Error al crear cliente: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Client created successfully:', result);

      // Recargar la lista de clientes
      await loadClients();

      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', address: '', productName: '', totalAmount: '', downPayment: '' });
      setFormErrors({});

      alert('Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', address: '', productName: '', totalAmount: '', downPayment: '' });
    setFormErrors({});
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!validateForm() || !editingClient) return;

    setSaving(true);
    try {
      const apiUrl = getApiUrl();

      console.log('SaveEdit - API URL:', apiUrl);

      // Actualizar cliente real en la API
      const response = await fetch(`${apiUrl}/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone,
          address: formData.address || undefined
        }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Error al actualizar cliente');
      }

      // Recargar la lista de clientes
      await loadClients();

      setShowEditModal(false);
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', address: '', productName: '', totalAmount: '', downPayment: '' });
      setFormErrors({});

      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '', productName: '', totalAmount: '', downPayment: '' });
    setFormErrors({});
  };

  const handleArchiveClient = async (client: Client) => {
    const reason = prompt('¿Cuál es la razón para archivar este cliente?', 'Cliente archivado por el administrador');
    if (!reason) return;

    try {
      const apiUrl = getApiUrl();

      console.log('ArchiveClient - API URL:', apiUrl);

      // Archivar cliente real en la API
      const response = await fetch(`${apiUrl}/api/clients/${client.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        // Get error message from response
        const errorText = await response.text();
        console.error('Archive error response:', response.status, errorText);

        // Show specific error message for clients with active debts
        if (errorText.includes('deudas activas')) {
          alert('No se puede archivar este cliente porque tiene deudas activas pendientes de pago. Primero debe liquidar todas las deudas.');
          return;
        }

        throw new Error(`Error al archivar cliente: ${errorText}`);
      }

      // Recargar la lista de clientes
      await loadClients();

      alert('Cliente archivado exitosamente');
    } catch (error) {
      console.error('Error archiving client:', error);
      alert(error instanceof Error ? error.message : 'Error al archivar el cliente');
    }
  };

  const canDeleteClient = (client: Client): boolean => {
    // === REQUISITOS FISCALES Y LEGALES PARA ELIMINACIÓN DE CLIENTES ===
    // Basado en normativas mexicanas de contabilidad y protección de datos

    // 1. INTEGRIDAD REFERENCIAL
    // No se puede eliminar un cliente que tenga relaciones activas con otras entidades

    // Verificar si el cliente tiene deudas activas (pendientes de pago)
    // En producción: consultar API de deudas activas
    const hasActiveDebts = Math.random() > 0.95; // Simulación: 5% tienen deudas activas

    // Verificar si el cliente tiene pagos registrados (historial financiero)
    // En producción: consultar API de pagos
    const hasPayments = Math.random() > 0.95; // Simulación: 5% tienen pagos

    // Verificar si el cliente tiene deudas liquidadas (historial completo)
    // En producción: consultar API de deudas cerradas
    const hasSettledDebts = Math.random() > 0.9; // Simulación: 10% tienen deudas liquidadas

    // 2. REGLAS DE NEGOCIO
    // Reglas específicas del negocio de joyería y gestión de deudas

    // Clientes con deudas vencidas no pagadas no deberían eliminarse
    // En producción: verificar deudas vencidas > 90 días
    const hasOverdueDebts = Math.random() > 0.98; // Simulación: 2% tienen deudas vencidas

    // Clientes con actividad reciente (últimos 30 días) podrían tener restricciones
    // En producción: verificar última actividad (pagos, actualizaciones, etc.)
    const createdDate = new Date(client.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const hasRecentActivity = createdDate > thirtyDaysAgo && Math.random() > 0.9; // Simulación

    // Clientes con montos altos de deuda histórica
    // En producción: verificar suma total de deudas > $10,000 MXN
    const hasHighValueHistory = Math.random() > 0.95; // Simulación: 5% tienen historial valioso

    // 3. CONSIDERACIONES LEGALES
    // Requisitos legales mexicanos para conservación de información financiera

    // === LEY FEDERAL PARA LA PREVENCIÓN E IDENTIFICACIÓN DE OPERACIONES CON RECURSOS DE PROCEDENCIA ILÍCITA ===
    // Los registros financieros deben conservarse por 5 años mínimo
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const withinRetentionPeriod = createdDate > fiveYearsAgo;

    // === CÓDIGO FISCAL DE LA FEDERACIÓN ===
    // Comprobantes fiscales deben conservarse por 5 años
    // Facturas, recibos y comprobantes relacionados con el cliente

    // === LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES ===
    // Datos personales deben manejarse con cuidado, eliminación solo cuando no hay relaciones activas

    // === NORMAS DE CONTABILIDAD ===
    // Registros contables deben mantenerse para auditorías

    // === REGLAS DE AUDITORÍA ===
    // Sistema debe mantener trazabilidad de eliminaciones para compliance
    // Solo administradores autorizados pueden eliminar
    // Debe registrarse quién, cuándo y por qué se eliminó

    // === CONCLUSIÓN ===
    // Solo pueden eliminarse clientes que:
    // 1. No tienen deudas activas, liquidadas, ni pagos registrados
    // 2. No tienen deudas vencidas
    // 3. No tienen actividad reciente que indique uso activo
    // 4. No tienen historial financiero valioso
    // 5. Están fuera del período de retención legal (5 años)
    // 6. Fueron creados por error del administrador (casos excepcionales)

    const meetsAllRequirements = !hasActiveDebts &&
                                !hasPayments &&
                                !hasSettledDebts &&
                                !hasOverdueDebts &&
                                !hasRecentActivity &&
                                !hasHighValueHistory &&
                                !withinRetentionPeriod;

    return meetsAllRequirements;
  };

  const handleDeleteClient = async (client: Client) => {
    // Verificar si el cliente puede ser eliminado según las reglas
    if (!canDeleteClient(client)) {
      const confirm = window.confirm(
        `El cliente ${client.name} tiene restricciones para eliminación (deudas activas, historial financiero, o actividad reciente). ¿Desea archivarlo en lugar de eliminarlo?`
      );
      if (confirm) {
        await handleArchiveClient(client);
      }
      return;
    }

    // Solo los clientes completamente nuevos pueden ser eliminados
    if (window.confirm(`¿Está completamente seguro de eliminar a ${client.name}? Esta acción no se puede deshacer.`)) {
      try {
        const apiUrl = getApiUrl();

        console.log('DeleteClient - API URL:', apiUrl);

        // Eliminar cliente real de la API
        const response = await fetch(`${apiUrl}/api/clients/${client.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar cliente');
        }

        // Recargar la lista de clientes
        await loadClients();

        alert('Cliente eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const handleUnarchiveClient = async (client: Client) => {
    try {
      const apiUrl = getApiUrl();

      console.log('UnarchiveClient - API URL:', apiUrl);

      // Restaurar cliente real en la API
      const response = await fetch(`${apiUrl}/api/clients/${client.id}/unarchive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Error al restaurar cliente');
      }

      // Recargar la lista de clientes
      await loadClients();

      alert('Cliente restaurado exitosamente');
    } catch (error) {
      console.error('Error unarchiving client:', error);
      alert('Error al restaurar el cliente');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
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
        <h1 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: '#ffffff',
          flex: 1,
          textAlign: 'center',
          margin: 0
        }}>
          Gestión de Clientes
        </h1>
        <Button
          title="+ Agregar"
          onPress={handleAddClient}
          variant="primary"
          size="sm"
        />
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        borderBottomStyle: 'solid',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: `0 ${theme.spacing.lg}px`,
          display: 'flex',
          gap: theme.spacing.xl
        }}>
          {[
            { key: 'active', label: 'Activos' },
            { key: 'archived', label: 'Archivados' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'active' | 'archived')}
              style={{
                padding: `${theme.spacing.lg}px ${theme.spacing.sm}px`,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.key ? theme.colors.primary : 'transparent',
                borderBottomStyle: 'solid',
                fontWeight: theme.typography.fontWeight.medium,
                fontSize: theme.typography.fontSize.md,
                color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary,
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

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
            Cargando clientes...
          </div>
        ) : (
          <div style={{ padding: `${theme.spacing.xl}px 0` }}>
            {(() => {
              const filteredClients = activeTab === 'active'
                ? clients.filter(client => !client.archived)
                : clients.filter(client => client.archived);

              console.log('Filtered clients for tab', activeTab, ':', filteredClients.length);

              return filteredClients.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: theme.spacing.xl,
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.textSecondary
                }}>
                  {activeTab === 'active'
                    ? 'No hay clientes activos'
                    : 'No hay clientes archivados'
                  }
                </div>
              ) : (
                <div>
                  {filteredClients.map((client) => (
                    <Card key={client.id} style={{
                      marginBottom: theme.spacing.lg,
                      padding: theme.spacing.xl
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.text,
                            margin: 0,
                            marginBottom: theme.spacing.sm
                          }}>
                            {client.name}
                          </h3>
                          <p style={{
                            fontSize: theme.typography.fontSize.md,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            📞 {client.phone}
                          </p>
                          {client.email && (
                            <p style={{
                              fontSize: theme.typography.fontSize.md,
                              color: theme.colors.textSecondary,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              ✉️ {client.email}
                            </p>
                          )}
                          {client.address && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.textSecondary,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              📍 {client.address}
                            </p>
                          )}
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            📅 Creado: {formatDate(client.createdAt)}
                          </p>
                          {(client as any).productName && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.textSecondary,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              🛍️ Producto: {(client as any).productName}
                            </p>
                          )}
                          {(client as any).totalAmount > 0 && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.primary,
                              fontWeight: theme.typography.fontWeight.medium,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              💰 Total: ${((client as any).totalAmount || 0).toLocaleString('es-MX')}
                            </p>
                          )}
                          {(client as any).downPayment > 0 && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.success,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              💵 Enganche: ${((client as any).downPayment || 0).toLocaleString('es-MX')}
                            </p>
                          )}
                          {client.archived && client.archivedAt && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.warning,
                              margin: 0,
                              marginBottom: theme.spacing.xs
                            }}>
                              📦 Archivado: {formatDate(client.archivedAt)}
                            </p>
                          )}
                          {client.archived && client.archivedReason && (
                            <p style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.textSecondary,
                              margin: 0,
                              fontStyle: 'italic'
                            }}>
                              💬 {client.archivedReason}
                            </p>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: theme.spacing.sm,
                          marginLeft: theme.spacing.md
                        }}>
                          {activeTab === 'active' ? (
                            <>
                              <Button
                                title="Editar"
                                onPress={() => handleEditClient(client)}
                                variant="secondary"
                                size="sm"
                              />
                              <Button
                                title="Archivar"
                                onPress={() => handleArchiveClient(client)}
                                variant="outline"
                                size="sm"
                              />
                              {canDeleteClient(client) && (
                                <Button
                                  title="Eliminar"
                                  onPress={() => handleDeleteClient(client)}
                                  variant="danger"
                                  size="sm"
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                title="Restaurar"
                                onPress={() => handleUnarchiveClient(client)}
                                variant="primary"
                                size="sm"
                              />
                              {canDeleteClient(client) && (
                                <Button
                                  title="Eliminar"
                                  onPress={() => handleDeleteClient(client)}
                                  variant="danger"
                                  size="sm"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
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
              Editar Cliente
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Name Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.name ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ingrese el nombre completo"
                />
                {formErrors.name && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.email ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="cliente@email.com"
                />
                {formErrors.email && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.email}
                  </span>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.phone ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="5512345678"
                />
                {formErrors.phone && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>


              {/* Address Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Dirección
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                  placeholder="Dirección completa (opcional)"
                  rows={3}
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
                onPress={handleCancelEdit}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={saving ? "Guardando..." : "Actualizar Cliente"}
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

      {/* Add Client Modal */}
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
              Agregar Nuevo Cliente
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Name Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.name ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ingrese el nombre completo"
                />
                {formErrors.name && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.email ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="cliente@email.com"
                />
                {formErrors.email && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.email}
                  </span>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${formErrors.phone ? theme.colors.danger : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.md,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="5512345678"
                />
                {formErrors.phone && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.danger,
                    marginTop: theme.spacing.xs,
                    display: 'block'
                  }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>

              {/* Address Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs
                }}>
                  Dirección
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                  placeholder="Dirección completa (opcional)"
                  rows={3}
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
                onPress={handleCancelAdd}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={saving ? "Guardando..." : "Guardar Cliente"}
                onPress={handleSaveClient}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;
