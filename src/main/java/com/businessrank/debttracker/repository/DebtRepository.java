package com.businessrank.debttracker.repository;

import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {

    List<Debt> findByClient(Client client);

    List<Debt> findByClientAndStatus(Client client, Debt.Status status);

    List<Debt> findByStatus(Debt.Status status);

    List<Debt> findByArchived(boolean archived);

    List<Debt> findByClientAndArchived(Client client, boolean archived);

    List<Debt> findByTotalAmountGreaterThanEqual(BigDecimal amount);

    List<Debt> findByTotalAmountBetween(BigDecimal minAmount, BigDecimal maxAmount);

    List<Debt> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT d FROM Debt d WHERE d.client = :client AND d.status = :status ORDER BY d.createdAt DESC")
    List<Debt> findActiveDebtsByClient(@Param("client") Client client, @Param("status") Debt.Status status);

    @Query("SELECT d FROM Debt d WHERE d.client = :client ORDER BY d.createdAt DESC")
    List<Debt> findDebtsByClientOrdered(@Param("client") Client client);

    @Query("SELECT d FROM Debt d WHERE LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Debt> findByDescriptionContainingIgnoreCase(@Param("searchTerm") String searchTerm);

    @Query("SELECT d FROM Debt d WHERE d.client = :client AND LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Debt> findByClientAndDescriptionContainingIgnoreCase(@Param("client") Client client, @Param("searchTerm") String searchTerm);

    @Query("SELECT SUM(d.remainingAmount) FROM Debt d WHERE d.client = :client AND d.status = 'ACTIVE'")
    Double getTotalRemainingAmountByClient(@Param("client") Client client);

    @Query("SELECT SUM(d.totalAmount) FROM Debt d WHERE d.status = 'ACTIVE'")
    Double getTotalActiveDebtAmount();

    @Query("SELECT SUM(d.remainingAmount) FROM Debt d WHERE d.status = 'ACTIVE'")
    Double getTotalRemainingDebtAmount();

    @Query("SELECT COUNT(d) FROM Debt d WHERE d.status = 'ACTIVE'")
    Long getActiveDebtsCount();

    @Query("SELECT COUNT(d) FROM Debt d WHERE d.status = 'SETTLED'")
    Long getSettledDebtsCount();

    @Query("SELECT AVG(d.totalAmount) FROM Debt d WHERE d.status = 'ACTIVE'")
    Double getAverageActiveDebtAmount();

    @Query("SELECT d FROM Debt d WHERE d.remainingAmount > 0 AND d.status = 'ACTIVE' ORDER BY d.remainingAmount DESC")
    List<Debt> findDebtsWithRemainingAmount();

    @Query("SELECT d FROM Debt d WHERE d.status = 'ACTIVE' ORDER BY d.createdAt ASC")
    List<Debt> findOldestActiveDebts();

    @Query("SELECT d FROM Debt d WHERE d.status = 'ACTIVE' AND d.remainingAmount >= :minAmount ORDER BY d.remainingAmount DESC")
    List<Debt> findHighValueActiveDebts(@Param("minAmount") BigDecimal minAmount);

    @Query("SELECT d FROM Debt d WHERE d.status = 'ACTIVE' AND d.dueDate IS NOT NULL AND d.dueDate < :currentDate")
    List<Debt> findOverdueDebts(@Param("currentDate") LocalDate currentDate);
}