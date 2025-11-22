package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.ClientRepository;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class NotificationService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private EmailService emailService;

    // Ejecutar cada semana (domingo a las 9 AM)
    @Scheduled(cron = "0 0 9 ? * SUN")
    public void sendWeeklyPaymentReminders() {
        System.out.println("Iniciando envío de recordatorios semanales de pagos...");

        List<Client> clients = clientRepository.findAll();

        for (Client client : clients) {
            List<Debt> activeDebts = debtRepository.findByClientAndStatus(client, Debt.Status.ACTIVE);

            if (!activeDebts.isEmpty()) {
                // Verificar si el cliente ha hecho pagos en la última semana
                LocalDateTime oneWeekAgo = LocalDateTime.now().minus(7, ChronoUnit.DAYS);
                List<Payment> recentPayments = paymentRepository
                    .findPaymentsByClient(client)
                    .stream()
                    .filter(payment -> payment.getPaymentDate().isAfter(oneWeekAgo))
                    .toList();

                if (recentPayments.isEmpty()) {
                    // No ha pagado en la última semana, enviar recordatorio
                    sendPaymentReminder(client, activeDebts);
                }
            }
        }

        System.out.println("Envío de recordatorios semanales completado.");
    }

    private void sendPaymentReminder(Client client, List<Debt> activeDebts) {
        try {
            String subject = "Recordatorio de Pago - Joyería";

            StringBuilder message = new StringBuilder();
            message.append("Estimado ").append(client.getName()).append(",\n\n");
            message.append("Le recordamos que tiene las siguientes deudas pendientes:\n\n");

            double totalPending = 0;
            for (Debt debt : activeDebts) {
                message.append("- ").append(debt.getDescription() != null ? debt.getDescription() : "Deuda")
                      .append(": $").append(String.format("%.2f", debt.getRemainingAmount()))
                      .append(" restantes\n");
                totalPending += debt.getRemainingAmount().doubleValue();
            }

            message.append("\nTotal pendiente: $").append(String.format("%.2f", totalPending));
            message.append("\n\nPor favor, realice su pago semanal para mantener al día sus obligaciones.");
            message.append("\n\nAtentamente,\nJoyería - Sistema de Registro de Deudas");

            emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message.toString());

            System.out.println("Recordatorio enviado a cliente: " + client.getName());

        } catch (Exception e) {
            System.err.println("Error enviando recordatorio a cliente " + client.getName() + ": " + e.getMessage());
        }
    }

    // Método para enviar notificaciones inmediatas cuando se vence una deuda
    public void sendDebtOverdueNotification(Client client, Debt debt) {
        try {
            String subject = "Deuda Vencida - Joyería";

            String message = String.format(
                "Estimado %s,\n\n" +
                "Le informamos que su deuda '%s' está vencida.\n" +
                "Monto pendiente: $%.2f\n\n" +
                "Por favor, contacte con la joyería para regularizar su situación.\n\n" +
                "Atentamente,\n" +
                "Joyería - Sistema de Registro de Deudas",
                client.getName(),
                debt.getDescription() != null ? debt.getDescription() : "Deuda",
                debt.getRemainingAmount()
            );

            emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación de deuda vencida: " + e.getMessage());
        }
    }

    // Notificaciones por eventos de pago
    public void sendPaymentReceivedNotification(Client client, Payment payment) {
        try {
            String subject = "Pago Recibido - Joyería";

            String message = String.format(
                "Estimado %s,\n\n" +
                "Hemos recibido su pago por $%.2f (%s).\n\n" +
                "Detalles del pago:\n" +
                "- Monto: $%.2f\n" +
                "- Método: %s\n" +
                "- Fecha: %s\n" +
                "- Deuda: %s\n\n" +
                "Gracias por su pago. Su deuda se ha actualizado automáticamente.\n\n" +
                "Atentamente,\n" +
                "Joyería - Sistema de Registro de Deudas",
                client.getName(),
                payment.getAmount(),
                payment.getPaymentMethod().toString(),
                payment.getAmount(),
                payment.getPaymentMethod().toString(),
                payment.getPaymentDate().toString(),
                payment.getDebt().getDescription() != null ? payment.getDebt().getDescription() : "Deuda"
            );

            emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación de pago recibido: " + e.getMessage());
        }
    }

    public void sendDebtSettledNotification(Client client, Debt debt) {
        try {
            String subject = "Deuda Liquidada - Joyería";

            String message = String.format(
                "¡Felicitaciones %s!\n\n" +
                "Su deuda '%s' ha sido completamente liquidada.\n\n" +
                "Detalles:\n" +
                "- Deuda: %s\n" +
                "- Monto total: $%.2f\n" +
                "- Fecha de liquidación: %s\n\n" +
                "Gracias por completar sus pagos. Esperamos seguir sirviéndole.\n\n" +
                "Atentamente,\n" +
                "Joyería - Sistema de Registro de Deudas",
                client.getName(),
                debt.getDescription() != null ? debt.getDescription() : "Deuda",
                debt.getDescription() != null ? debt.getDescription() : "Deuda",
                debt.getTotalAmount(),
                LocalDateTime.now().toString()
            );

            emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación de deuda liquidada: " + e.getMessage());
        }
    }

    // Notificaciones administrativas
    public void sendNewClientNotification(Client client) {
        try {
            String subject = "Nuevo Cliente Registrado - Joyería";

            String message = String.format(
                "Nuevo cliente registrado en el sistema:\n\n" +
                "Nombre: %s\n" +
                "Teléfono: %s\n" +
                "Email: %s\n" +
                "Dirección: %s\n" +
                "Fecha de registro: %s\n\n" +
                "El cliente ya puede acceder a la aplicación móvil.",
                client.getName(),
                client.getPhone(),
                client.getEmail() != null ? client.getEmail() : "No especificado",
                client.getAddress() != null ? client.getAddress() : "No especificada",
                client.getCreatedAt() != null ? client.getCreatedAt().toString() : LocalDateTime.now().toString()
            );

            // Enviar a admin (usando un email temporal para desarrollo)
            emailService.sendEmail("admin@joyeria.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación de nuevo cliente: " + e.getMessage());
        }
    }

    public void sendHighPaymentNotification(Client client, Payment payment) {
        try {
            String subject = "Pago Grande Registrado - Joyería";

            String message = String.format(
                "Pago significativo registrado:\n\n" +
                "Cliente: %s\n" +
                "Monto: $%.2f\n" +
                "Método: %s\n" +
                "Deuda: %s\n" +
                "Fecha: %s\n\n" +
                "Este pago representa un ingreso considerable.",
                client.getName(),
                payment.getAmount(),
                payment.getPaymentMethod().toString(),
                payment.getDebt().getDescription() != null ? payment.getDebt().getDescription() : "Deuda",
                payment.getPaymentDate().toString()
            );

            emailService.sendEmail("admin@joyeria.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación de pago grande: " + e.getMessage());
        }
    }

    // Notificaciones programadas adicionales
    @Scheduled(cron = "0 0 10 1 * ?") // Primer día de cada mes a las 10 AM
    public void sendMonthlySummaryNotification() {
        try {
            System.out.println("Enviando resumen mensual...");

            // Calcular estadísticas del mes anterior
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfLastMonth = now.minusMonths(1).withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime endOfLastMonth = now.withDayOfMonth(1).minusDays(1).toLocalDate().atTime(23, 59, 59);

            List<Payment> lastMonthPayments = paymentRepository.findPaymentsInDateRange(startOfLastMonth, endOfLastMonth);
            BigDecimal totalRevenue = lastMonthPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String subject = "Resumen Mensual - " + startOfLastMonth.getMonth().toString() + " " + startOfLastMonth.getYear();

            String message = String.format(
                "RESUMEN MENSUAL DE PAGOS\n\n" +
                "Período: %s - %s\n\n" +
                "ESTADÍSTICAS GENERALES:\n" +
                "- Total de pagos: %d\n" +
                "- Ingresos totales: $%.2f\n" +
                "- Pago promedio: $%.2f\n\n" +
                "DETALLE POR MÉTODO DE PAGO:\n",
                startOfLastMonth.toLocalDate().toString(),
                endOfLastMonth.toLocalDate().toString(),
                lastMonthPayments.size(),
                totalRevenue,
                lastMonthPayments.isEmpty() ? 0.0 : totalRevenue.doubleValue() / lastMonthPayments.size()
            );

            // Agregar detalle por método de pago
            Map<Payment.PaymentMethod, BigDecimal> methodTotals = new HashMap<>();
            Map<Payment.PaymentMethod, Integer> methodCounts = new HashMap<>();

            for (Payment payment : lastMonthPayments) {
                methodTotals.merge(payment.getPaymentMethod(), payment.getAmount(), BigDecimal::add);
                methodCounts.merge(payment.getPaymentMethod(), 1, Integer::sum);
            }

            for (Map.Entry<Payment.PaymentMethod, BigDecimal> entry : methodTotals.entrySet()) {
                message += String.format("- %s: %d pagos, $%.2f\n",
                    entry.getKey().toString(),
                    methodCounts.get(entry.getKey()),
                    entry.getValue());
            }

            emailService.sendEmail("admin@joyeria.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando resumen mensual: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 8 * * ?") // Todos los días a las 8 AM
    public void sendDailyRevenueNotification() {
        try {
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            LocalDateTime startOfYesterday = yesterday.toLocalDate().atStartOfDay();
            LocalDateTime endOfYesterday = yesterday.toLocalDate().atTime(23, 59, 59);

            List<Payment> yesterdayPayments = paymentRepository.findPaymentsInDateRange(startOfYesterday, endOfYesterday);
            BigDecimal yesterdayRevenue = yesterdayPayments.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String subject = "Ingresos de Ayer - " + yesterday.toLocalDate().toString();

            String message = String.format(
                "INGRESOS DEL DÍA ANTERIOR\n\n" +
                "Fecha: %s\n" +
                "Total de pagos: %d\n" +
                "Ingresos totales: $%.2f\n" +
                "Pago promedio: $%.2f\n\n" +
                "¡Buen día!",
                yesterday.toLocalDate().toString(),
                yesterdayPayments.size(),
                yesterdayRevenue,
                yesterdayPayments.isEmpty() ? 0.0 : yesterdayRevenue.doubleValue() / yesterdayPayments.size()
            );

            emailService.sendEmail("admin@joyeria.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación diaria de ingresos: " + e.getMessage());
        }
    }

    // Notificaciones de alertas
    @Scheduled(cron = "0 30 9 * * ?") // Todos los días a las 9:30 AM
    public void checkAndSendOverdueAlerts() {
        try {
            System.out.println("Verificando deudas vencidas...");

            List<Debt> overdueDebts = debtRepository.findOverdueDebts(LocalDate.now());
            int overdueCount = 0;

            for (Debt debt : overdueDebts) {
                // Solo enviar notificación si tiene monto pendiente
                if (debt.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
                    sendDebtOverdueNotification(debt.getClient(), debt);
                    overdueCount++;
                }
            }

            if (overdueCount > 0) {
                System.out.println("Se enviaron " + overdueCount + " notificaciones de deudas vencidas.");
            }

        } catch (Exception e) {
            System.err.println("Error verificando deudas vencidas: " + e.getMessage());
        }
    }

    // Método para enviar notificaciones push (simulado para desarrollo)
    public void sendPushNotification(String deviceToken, String title, String message) {
        // En un sistema real, aquí se integraría con FCM, APNs, etc.
        System.out.println("PUSH NOTIFICATION:");
        System.out.println("Device: " + deviceToken);
        System.out.println("Title: " + title);
        System.out.println("Message: " + message);

        // Simular envío exitoso
        System.out.println("Push notification sent successfully (simulated)");
    }

    // Notificaciones para eventos del sistema
    public void sendSystemNotification(String event, String details) {
        try {
            String subject = "Notificación del Sistema - " + event;

            String message = String.format(
                "EVENTO DEL SISTEMA\n\n" +
                "Tipo: %s\n" +
                "Detalles: %s\n" +
                "Timestamp: %s\n\n" +
                "Esta es una notificación automática del sistema.",
                event,
                details,
                LocalDateTime.now().toString()
            );

            emailService.sendEmail("admin@joyeria.com", subject, message);

        } catch (Exception e) {
            System.err.println("Error enviando notificación del sistema: " + e.getMessage());
        }
    }

    // Método genérico para notificaciones personalizadas
    public void sendCustomNotification(Client client, String subject, String message) {
        try {
            emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message);
        } catch (Exception e) {
            System.err.println("Error enviando notificación personalizada: " + e.getMessage());
        }
    }

    // Método para notificar a todos los clientes (campañas)
    public void sendBulkNotification(String subject, String message) {
        try {
            List<Client> clients = clientRepository.findAll();

            for (Client client : clients) {
                try {
                    emailService.sendEmail(client.getUser().getPhone() + "@temp.com", subject, message);
                    Thread.sleep(100); // Pequeña pausa para evitar spam
                } catch (Exception e) {
                    System.err.println("Error enviando notificación masiva a " + client.getName() + ": " + e.getMessage());
                }
            }

            System.out.println("Notificación masiva enviada a " + clients.size() + " clientes.");

        } catch (Exception e) {
            System.err.println("Error en envío masivo: " + e.getMessage());
        }
    }
}