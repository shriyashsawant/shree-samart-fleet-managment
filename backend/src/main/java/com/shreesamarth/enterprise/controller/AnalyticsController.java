package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.*;
import com.shreesamarth.enterprise.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // Get Vehicle P&L Report - Revenue - Expenses = Profit per mixer
    @GetMapping("/vehicle-profit")
    public ResponseEntity<List<VehicleProfitDTO>> getVehicleProfitReport(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getVehicleProfitReport(tenantId));
    }

    // Get Monthly Profit Trend
    @GetMapping("/monthly-profit")
    public ResponseEntity<List<MonthlyProfitDTO>> getMonthlyProfitTrend(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "12") int months) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getMonthlyProfitTrend(tenantId, months));
    }

    // Get Expense Breakdown - Diesel vs Salary vs Maintenance
    @GetMapping("/expense-breakdown")
    public ResponseEntity<List<ExpenseBreakdownDTO>> getExpenseBreakdown(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getExpenseBreakdown(tenantId));
    }

    // Get GST Summary Report - Monthly CGST/SGST totals
    @GetMapping("/gst-summary")
    public ResponseEntity<List<GstSummaryDTO>> getGstSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "12") int months) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getGstSummary(tenantId, months));
    }

    // Get Party Wise Revenue - Which client gives most business
    @GetMapping("/party-revenue")
    public ResponseEntity<List<PartyRevenueDTO>> getPartyWiseRevenue(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getPartyWiseRevenue(tenantId));
    }

    // Get Idle Vehicle Alerts - Flag vehicles with high expense, low revenue
    @GetMapping("/idle-alerts")
    public ResponseEntity<List<IdleVehicleAlertDTO>> getIdleVehicleAlerts(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getIdleVehicleAlerts(tenantId));
    }

    // Get vehicle P&L for a specific month: /api/vehicles/{id}/profit?month=2025-03
    @GetMapping("/vehicles/{id}/profit")
    public ResponseEntity<VehicleProfitDTO> getVehicleProfitByMonth(
            @PathVariable("id") Long vehicleId,
            @RequestParam String month) {
        return ResponseEntity.ok(analyticsService.getVehicleProfitByMonth(vehicleId, month));
    }

    // Get Document Health Score: /api/analytics/vehicles/{id}/document-health
    @GetMapping("/vehicles/{id}/document-health")
    public ResponseEntity<DocumentHealthDTO> getDocumentHealth(@PathVariable("id") Long vehicleId) {
        return ResponseEntity.ok(analyticsService.getDocumentHealth(vehicleId));
    }

    // Get Vehicle Summaries for card view: /api/analytics/vehicles/summary
    @GetMapping("/vehicles/summary")
    public ResponseEntity<List<VehicleSummaryDTO>> getVehicleSummaries(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = getTenantId(userDetails);
        return ResponseEntity.ok(analyticsService.getVehicleSummaries(tenantId));
    }

    // Get Detailed Vehicle Profile: /api/analytics/vehicles/{id}/profile
    @GetMapping("/vehicles/{id}/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<VehicleProfileDTO> getVehicleProfile(@PathVariable("id") Long vehicleId) {
        return ResponseEntity.ok(analyticsService.getVehicleProfile(vehicleId));
    }

    private Long getTenantId(UserDetails userDetails) {
        // For now, return a default tenant ID
        // In production, extract from JWT token
        return 1L;
    }
}
