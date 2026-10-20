package com.example.jobnova_backend.controller;

import com.example.jobnova_backend.dto.ApplicationStatusRequest;
import com.example.jobnova_backend.service.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/job/{jobId}")
    public ResponseEntity<?> applyForJob(
            @PathVariable String jobId,
            @RequestParam(required = false) String coverLetter,
            @RequestParam(required = false) BigDecimal salaryExpectation,
            @RequestParam(required = false) String profileData,
            @RequestParam(required = false) MultipartFile resume,
            Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                applicationService.applyForJob(
                        jobId, coverLetter, salaryExpectation,
                        profileData, resume, authentication));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getJobApplications(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            Authentication authentication) {

        return ResponseEntity.ok(applicationService.getJobApplications(
                jobId, page, limit, status, sortBy, sortOrder,
                authentication));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyApplications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            Authentication authentication) {

        return ResponseEntity.ok(applicationService.getMyApplications(
                page, limit, status, sortBy, sortOrder,
                authentication));
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable String applicationId,
            @RequestBody ApplicationStatusRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                applicationService.updateApplicationStatus(
                        applicationId, request, authentication));
    }

    @GetMapping("/{applicationId}")
    public ResponseEntity<?> getApplicationById(
            @PathVariable String applicationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                applicationService.getApplicationById(
                        applicationId, authentication));
    }

    @PatchMapping("/{applicationId}/withdraw")
    public ResponseEntity<?> withdrawApplication(
            @PathVariable String applicationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                applicationService.withdrawApplication(
                        applicationId, authentication));
    }

    @GetMapping("/job/{jobId}/stats")
    public ResponseEntity<?> getApplicationStats(
            @PathVariable String jobId,
            Authentication authentication) {

        return ResponseEntity.ok(
                applicationService.getApplicationStats(
                        jobId, authentication));
    }
}