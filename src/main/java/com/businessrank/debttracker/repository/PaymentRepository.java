package com.businessrank.debttracker.repository;

import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.model.Debt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByDebt(Debt debt);

    List<Payment> findByDebtOrderByPaymentDateDesc(Debt debt);

    List<Payment> findByPaymentMethod(Payment.PaymentMethod paymentMethod);

    List<Payment> findByAmountGreaterThanEqual(BigDecimal amount);

    List<Payment> findByAmountBetween(BigDecimal minAmount, BigDecimal maxAmount);

    List<Payment> findByPaymentDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT p FROM Payment p WHERE p.debt.client = :client ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsByClient(@Param("client") com.businessrank.debttracker.model.Client client);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.debt = :debt")
    Double getTotalPaymentsByDebt(@Param("debt") Debt debt);

    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    Double getTotalPaymentsInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentMethod = :method AND p.paymentDate BETWEEN :startDate AND :endDate")
    Double getTotalPaymentsByMethodInDateRange(@Param("method") Payment.PaymentMethod method,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    Long getPaymentCountInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    Double getAveragePaymentAmountInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM Payment p WHERE LOWER(p.notes) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Payment> findByNotesContainingIgnoreCase(@Param("searchTerm") String searchTerm);

    @Query("SELECT p FROM Payment p WHERE p.debt.client = :client AND LOWER(p.notes) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Payment> findByClientAndNotesContainingIgnoreCase(@Param("client") com.businessrank.debttracker.model.Client client, @Param("searchTerm") String searchTerm);

    @Query("SELECT SUM(p.amount) FROM Payment p")
    Double getTotalAllPayments();

    @Query("SELECT COUNT(p) FROM Payment p")
    Long getTotalPaymentCount();

    @Query("SELECT p FROM Payment p ORDER BY p.paymentDate DESC")
    List<Payment> findAllOrderByPaymentDateDesc();

    @Query("SELECT p FROM Payment p WHERE p.debt.client = :client ORDER BY p.paymentDate DESC LIMIT :limit")
    List<Payment> findRecentPaymentsByClient(@Param("client") com.businessrank.debttracker.model.Client client, @Param("limit") int limit);
}