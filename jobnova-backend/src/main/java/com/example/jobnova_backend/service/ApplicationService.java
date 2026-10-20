package com.example.jobnova_backend.service;

import com.example.jobnova_backend.dto.ApplicationStatusRequest;
import com.example.jobnova_backend.entity.Application;
import com.example.jobnova_backend.entity.Application.Status;
import com.example.jobnova_backend.entity.Job;
import com.example.jobnova_backend.entity.User;
import com.example.jobnova_backend.repository.ApplicationRepository;
import com.example.jobnova_backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import com.example.jobnova_backend.repository.JobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            JobRepository jobRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
    }

    public Map<String, Object> applyForJob(
            String jobId,
            String coverLetter,
            BigDecimal salaryExpectation,
            String profileData,
            MultipartFile resume,
            Authentication authentication) {

        User applicant = currentUser(authentication);
        requireRole(applicant, "jobseeker");

        Job job = findJob(jobId);

        if (job.getIsActive() != null && !job.getIsActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This job is no longer active");
        }

        if (applicationRepository.existsByJobAndApplicant(job, applicant)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You have already applied for this job");
        }

        Application application = new Application();
        application.setJob(job);
        application.setApplicant(applicant);
        application.setCoverLetter(coverLetter);

        Map<String, Object> profile = parseJsonObject(profileData);
        application.setProfileData(profile);

        if (salaryExpectation != null) {
            Map<String, Object> salary = new LinkedHashMap<>();
            salary.put("amount", salaryExpectation);
            salary.put("currency", "INR");
            application.setSalaryExpectation(salary);
        }

        // Resume persistence is intentionally not faked. Add secure file storage
        // before enabling resume uploads.
        if (resume != null && !resume.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_IMPLEMENTED,
                    "Resume uploads are not configured yet");
        }

        application.updateStatus(Status.SUBMITTED.getValue(), "Application submitted");
        Application saved = applicationRepository.save(application);

        job.incrementApplications();
        jobRepository.save(job);

        return Map.of(
                "success", true,
                "message", "Application submitted successfully",
                "data", saved
        );
    }

    public Map<String, Object> getJobApplications(
            String jobId,
            int page,
            int limit,
            String status,
            String sortBy,
            String sortOrder,
            Authentication authentication) {

        User user = currentUser(authentication);
        Job job = findJob(jobId);
        requireJobOwner(job, user);

        Pageable pageable = pageable(page, limit, sortBy, sortOrder);
        Page<Application> results;

        if (isAll(status)) {
            results = applicationRepository.findByJob(job, pageable);
        } else {
            results = applicationRepository.findByJobAndStatus(
                    job, parseStatus(status), pageable);
        }

        return pageResponse(results);
    }

    public Map<String, Object> getMyApplications(
            int page,
            int limit,
            String status,
            String sortBy,
            String sortOrder,
            Authentication authentication) {

        User applicant = currentUser(authentication);
        requireRole(applicant, "jobseeker");

        Pageable pageable = pageable(page, limit, sortBy, sortOrder);
        Page<Application> results;

        if (isAll(status)) {
            results = applicationRepository.findByApplicant(applicant, pageable);
        } else {
            results = applicationRepository.findByApplicantAndStatus(
                    applicant, parseStatus(status), pageable);
        }

        return pageResponse(results);
    }

    public Map<String, Object> updateApplicationStatus(
            String applicationId,
            ApplicationStatusRequest request,
            Authentication authentication) {

        User employer = currentUser(authentication);
        requireRole(employer, "employer");

        Application application = findApplication(applicationId);
        requireJobOwner(application.getJob(), employer);

        Status newStatus = parseStatus(request.getStatus());

        if (newStatus == Status.WITHDRAWN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Employers cannot withdraw an applicant's application");
        }

        if (request.getInterviewDetails() != null) {
            application.setInterviewDetails(request.getInterviewDetails());
        }

        if (request.getFeedback() != null) {
            application.addFeedback(request.getFeedback());
        }

        application.updateStatus(
                newStatus.getValue(),
                request.getNotes()
        );

        Application saved = applicationRepository.save(application);

        return Map.of("success", true, "data", saved);
    }

    public Map<String, Object> getApplicationById(
            String applicationId,
            Authentication authentication) {

        User user = currentUser(authentication);
        Application application = findApplication(applicationId);

        boolean applicantOwns =
                application.getApplicant().getId().equals(user.getId());

        boolean employerOwns =
                application.getJob().getPostedBy() != null
                && application.getJob().getPostedBy().getId().equals(user.getId());

        if (!applicantOwns && !employerOwns) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Access denied");
        }

        return Map.of("success", true, "data", application);
    }

    public Map<String, Object> withdrawApplication(
            String applicationId,
            Authentication authentication) {

        User applicant = currentUser(authentication);
        requireRole(applicant, "jobseeker");

        Application application = findApplication(applicationId);

        if (!application.getApplicant().getId().equals(applicant.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only withdraw your own applications");
        }

        Status currentStatus = application.getStatus();

        if (currentStatus == Status.SELECTED || currentStatus == Status.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected or rejected applications cannot be withdrawn");
        }

        if (currentStatus != Status.WITHDRAWN) {
            application.updateStatus(Status.WITHDRAWN.getValue(), "Application withdrawn");
            applicationRepository.save(application);

            Job job = application.getJob();
            job.decrementApplications();
            jobRepository.save(job);
        }

        return Map.of(
                "success", true,
                "message", "Application withdrawn successfully",
                "data", application
        );
    }

    public Map<String, Object> getApplicationStats(
            String jobId,
            Authentication authentication) {

        User employer = currentUser(authentication);
        Job job = findJob(jobId);
        requireJobOwner(job, employer);

        Map<String, Long> stats = new LinkedHashMap<>();
        long total = 0;

        for (Status status : Status.values()) {
            long count = applicationRepository.countByJobAndStatus(job, status);
            stats.put(status.getValue(), count);
            total += count;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("total", total);
        result.put("stats", stats);
        return result;
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED, "User not found"));
        }

        try {
            Long id = Long.parseLong(authentication.getName());
            return userRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED, "User not found"));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated principal does not identify a user");
        }
    }

    private void requireRole(User user, String expectedRole) {
        if (user.getRole() == null
                || !expectedRole.equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private void requireJobOwner(Job job, User user) {
        if (job.getPostedBy() == null
                || !job.getPostedBy().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to manage this job's applications");
        }
    }

    private Job findJob(String jobId) {
        try {
            Long id = Long.parseLong(jobId);
            return jobRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Job not found"));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid job ID");
        }
    }

    private Application findApplication(String applicationId) {
        try {
            Long id = Long.parseLong(applicationId);
            return applicationRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Application not found"));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid application ID");
        }
    }

    private Status parseStatus(String value) {
        try {
            return Status.fromValue(value);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private boolean isAll(String status) {
        return status == null || status.isBlank()
                || "all".equalsIgnoreCase(status);
    }

    private Pageable pageable(
            int page,
            int limit,
            String sortBy,
            String sortOrder) {

        if (page < 1 || limit < 1 || limit > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be at least 1 and limit must be between 1 and 100");
        }

        String field = switch (sortBy == null ? "" : sortBy) {
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            case "status" -> "status";
            default -> "createdAt";
        };

        Sort.Direction direction =
                "asc".equalsIgnoreCase(sortOrder)
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        return PageRequest.of(page - 1, limit, Sort.by(direction, field));
    }

    private Map<String, Object> pageResponse(Page<Application> page) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("data", page.getContent());
        result.put("currentPage", page.getNumber() + 1);
        result.put("totalPages", page.getTotalPages());
        result.put("totalItems", page.getTotalElements());
        result.put("pageSize", page.getSize());
        return result;
    }

    private Map<String, Object> parseJsonObject(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }

        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(
                            json,
                            new com.fasterxml.jackson.core.type.TypeReference<
                                    Map<String, Object>>() {}
                    );
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid profileData JSON");
        }
    }
}