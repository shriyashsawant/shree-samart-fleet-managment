package com.shreesamarth.enterprise.config;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    @Transactional(readOnly = true)
    public ResponseEntity<?> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
            "error", e.getClass().getSimpleName(),
            "message", e.getMessage() != null ? e.getMessage() : "null",
            "type", e.getClass().getName()
        ));
    }
}
