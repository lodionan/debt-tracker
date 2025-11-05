package com.businessrank.debttracker.repository;

import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.model.Debt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByDebt(Debt debt);

    List<Payment> findByDebtOrderByPaymentDateDesc(Debt debt);

    @Query("SELECT p FROM Payment p WHERE p.debt.client = :client ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsByClient(@Param("client") com.businessrank.debttracker.model.Client client);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.debt = :debt")
    Double getTotalPaymentsByDebt(@Param("debt") Debt debt);

    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsInDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}