package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.DriverDocument;
import com.shreesamarth.enterprise.repository.DriverDocumentRepository;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/driver-documents")
@RequiredArgsConstructor
public class DriverDocumentController {

    private final DriverDocumentRepository documentRepository;
    private final DriverRepository driverRepository;
    private final FileUploadService fileUploadService;

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverDocument>> getByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(documentRepository.findByDriverId(driverId));
    }

    @PostMapping
    public ResponseEntity<DriverDocument> uploadDocument(
            @RequestParam("driverId") Long driverId,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        DriverDocument doc = new DriverDocument();
        doc.setDriver(driver);
        doc.setDocumentType(documentType);
        doc.setDocumentNumber(documentNumber);
        if (expiryDate != null && !expiryDate.isEmpty()) {
            doc.setExpiryDate(LocalDate.parse(expiryDate));
        }

        if (file != null && !file.isEmpty()) {
            // Upload to Firebase or local storage
            String fileUrl = fileUploadService.uploadFile(file, "driver-documents");
            doc.setFilePath(fileUrl);
            doc.setDocumentName(file.getOriginalFilename());
        }

        return ResponseEntity.ok(documentRepository.save(doc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
