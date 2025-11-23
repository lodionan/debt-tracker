import React, { useState } from 'react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { theme } from '../shared/styles/theme';
import { useNavigate } from 'react-router-dom';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailReportsEnabled, setEmailReportsEnabled] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const handleSaveSettings = () => {
    alert('Los cambios han sido guardados exitosamente');
  };

  const handleResetSettings = () => {
    if (window.confirm('¿Estás seguro de restablecer toda la configuración a los valores predeterminados?')) {
      setNotificationsEnabled(true);
      setEmailReportsEnabled(false);
      setAutoBackupEnabled(true);
      alert('Configuración restablecida');
    }
  };

  const handleExportData = () => {
    alert('Funcionalidad próximamente disponible');
  };

  const handleImportData = () => {
    alert('Funcionalidad próximamente disponible');
  };

  const handleClearData = () => {
    if (window.confirm('¿Estás seguro de limpiar todos los datos? Esta acción no se puede deshacer.')) {
      alert('Esta acción está deshabilitada por seguridad');
    }
  };

  const handleChangePassword = () => {
    alert('Funcionalidad próximamente disponible');
  };

  const handleAbout = () => {
    alert('Acerca de Miry\nSistema de Registro de Deudas de Joyería\nVersión 1.0.0\n© 2024 Business Rank');
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
          Configuración del Sistema
        </h1>
        <Button
          title="💾 Guardar"
          onPress={handleSaveSettings}
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
        {/* Notifications Settings */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            🔔 Notificaciones
          </h2>

          <Card style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                Notificaciones Push
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: 0
              }}>
                Recibir notificaciones sobre pagos pendientes y recordatorios
              </p>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: 50,
              height: 24,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: notificationsEnabled ? '#10b981' : '#d1d5db',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: 18,
                  width: 18,
                  left: notificationsEnabled ? 28 : 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </Card>

          <Card style={{
            padding: theme.spacing.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                Reportes por Email
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: 0
              }}>
                Enviar reportes mensuales automáticamente por email
              </p>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: 50,
              height: 24,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={emailReportsEnabled}
                onChange={(e) => setEmailReportsEnabled(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: emailReportsEnabled ? '#10b981' : '#d1d5db',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: 18,
                  width: 18,
                  left: emailReportsEnabled ? 28 : 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </Card>
        </section>

        {/* Data Management */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            💾 Gestión de Datos
          </h2>

          <Card style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                Respaldo Automático
              </h3>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: 0
              }}>
                Crear respaldos automáticos de la base de datos
              </p>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: 50,
              height: 24,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: autoBackupEnabled ? '#10b981' : '#d1d5db',
                borderRadius: 24,
                transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: 18,
                  width: 18,
                  left: autoBackupEnabled ? 28 : 3,
                  bottom: 3,
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.4s'
                }}></span>
              </span>
            </label>
          </Card>

          <div
            style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
            onClick={handleExportData}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs
            }}>
              📤 Exportar Datos
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Descargar todos los datos en formato CSV
            </div>
          </div>

          <div
            style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
            onClick={handleImportData}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs
            }}>
              📥 Importar Datos
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Cargar datos desde archivo CSV
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            🔒 Seguridad
          </h2>

          <div
            style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
            onClick={handleChangePassword}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs
            }}>
              🔑 Cambiar Contraseña
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Actualizar la contraseña de administrador
            </div>
          </div>
        </section>

        {/* System Information */}
        <section style={{ marginBottom: theme.spacing.xl }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            ℹ️ Información del Sistema
          </h2>

          <Card style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Versión de la App:
            </span>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text
            }}>
              1.0.0
            </span>
          </Card>

          <Card style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Base de Datos:
            </span>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text
            }}>
              MySQL 8.0
            </span>
          </Card>

          <Card style={{
            padding: theme.spacing.lg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Último Respaldo:
            </span>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text
            }}>
              2024-01-15 14:30
            </span>
          </Card>
        </section>

        {/* Danger Zone */}
        <section style={{
          marginBottom: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          borderTopStyle: 'solid'
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            marginBottom: theme.spacing.lg
          }}>
            ⚠️ Zona de Peligro
          </h2>

          <div
            style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              borderWidth: 1,
              borderColor: theme.colors.danger,
              borderStyle: 'solid'
            }}
            onClick={handleResetSettings}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.danger,
              marginBottom: theme.spacing.xs
            }}>
              🔄 Restablecer Configuración
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.danger,
              opacity: 0.7
            }}>
              Volver a configuración predeterminada
            </div>
          </div>

          <div
            style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              borderWidth: 1,
              borderColor: theme.colors.danger,
              borderStyle: 'solid'
            }}
            onClick={handleClearData}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.danger,
              marginBottom: theme.spacing.xs
            }}>
              🗑️ Limpiar Todos los Datos
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.danger,
              opacity: 0.7
            }}>
              Eliminar permanentemente todos los registros
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <div
            style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              textAlign: 'center'
            }}
            onClick={handleAbout}
          >
            <div style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text
            }}>
              ℹ️ Acerca de Miry
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsScreen;