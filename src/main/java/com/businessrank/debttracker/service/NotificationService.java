package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.repository.ClientRepository;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

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
}