package com.shreesamarth.enterprise.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final DataSource dataSource;

    public DebugController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/raw-vehicles")
    public ResponseEntity<List<Map<String, Object>>> getRawVehicles() {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, vehicle_number, model, status FROM vehicles")) {
            
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", rs.getLong("id"));
                row.put("vehicleNumber", rs.getString("vehicle_number"));
                row.put("model", rs.getString("model"));
                row.put("status", rs.getString("status"));
                results.add(row);
            }
            
            System.out.println("🔍 [DEBUG] Raw vehicles query returned: " + results.size() + " rows");
            return ResponseEntity.ok(results);
            
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error querying vehicles: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            results.add(error);
            return ResponseEntity.internalServerError().body(results);
        }
    }

    @GetMapping("/raw-drivers")
    public ResponseEntity<List<Map<String, Object>>> getRawDrivers() {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, name, phone, status FROM drivers")) {
            
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", rs.getLong("id"));
                row.put("name", rs.getString("name"));
                row.put("phone", rs.getString("phone"));
                row.put("status", rs.getString("status"));
                results.add(row);
            }
            
            System.out.println("🔍 [DEBUG] Raw drivers query returned: " + results.size() + " rows");
            return ResponseEntity.ok(results);
            
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error querying drivers: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            results.add(error);
            return ResponseEntity.internalServerError().body(results);
        }
    }

    @GetMapping("/db-info")
    public ResponseEntity<Map<String, Object>> getDbInfo() {
        Map<String, Object> info = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            info.put("databaseProductName", conn.getMetaData().getDatabaseProductName());
            info.put("databaseProductVersion", conn.getMetaData().getDatabaseProductVersion());
            info.put("url", conn.getMetaData().getURL());
            info.put("user", conn.getMetaData().getUserName());
            
            System.out.println("🔍 [DEBUG] DB Info: " + info);
            return ResponseEntity.ok(info);
            
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error getting DB info: " + e.getMessage());
            info.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(info);
        }
    }
}
