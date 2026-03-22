package com.shreesamarth.enterprise.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    @Value("${ocr.service.url:https://shree-samarth-ocr.onrender.com}")
    private String ocrServiceUrl;

    private final RestTemplate restTemplate;

    @Autowired
    public OcrService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Scheduled(fixedRateString = "${ocr.ping.interval:240000}")
    public void pingOcrService() {
        try {
            String url = ocrServiceUrl + "/api/ocr/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("OCR service ping successful");
            } else {
                log.warn("OCR service ping returned status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("OCR service ping failed: {}", e.getMessage());
        }
    }

    public Map<String, Object> extractDocument(MultipartFile file) throws IOException {
        String url = ocrServiceUrl + "/api/ocr/extract";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                Map.class
        );

        return response.getBody() != null ? response.getBody() : new HashMap<>();
    }

    public Map<String, Object> learnCorrection(String wrong, String correct, String fieldType) {
        String url = ocrServiceUrl + "/api/ocr/learn";

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("wrong", wrong);
        requestBody.put("correct", correct);
        if (fieldType != null) {
            requestBody.put("field_type", fieldType);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        return response.getBody() != null ? response.getBody() : new HashMap<>();
    }

    public Map<String, Object> getSuggestions(String fieldType, String prefix) {
        String url = ocrServiceUrl + "/api/ocr/suggestions?field_type=" + fieldType;
        if (prefix != null && !prefix.isEmpty()) {
            url += "&prefix=" + prefix;
        }

        HttpHeaders headers = new HttpHeaders();
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
        return response.getBody() != null ? response.getBody() : new HashMap<>();
    }

    public Map<String, Object> getCorrections() {
        String url = ocrServiceUrl + "/api/ocr/corrections";

        HttpHeaders headers = new HttpHeaders();
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
        return response.getBody() != null ? response.getBody() : new HashMap<>();
    }
}
