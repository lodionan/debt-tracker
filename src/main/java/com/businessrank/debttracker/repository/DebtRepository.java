package com.businessrank.debttracker.repository;

import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebtRepository extends JpaRepository<Debt, Long> {

    List<Debt> findByClient(Client client);

    List<Debt> findByClientAndStatus(Client client, Debt.Status status);

    @Query("SELECT d FROM Debt d WHERE d.client = :client AND d.status = :status ORDER BY d.createdAt DESC")
    List<Debt> findActiveDebtsByClient(@Param("client") Client client, @Param("status") Debt.Status status);

    @Query("SELECT SUM(d.remainingAmount) FROM Debt d WHERE d.client = :client AND d.status = 'ACTIVE'")
    Double getTotalRemainingAmountByClient(@Param("client") Client client);
}