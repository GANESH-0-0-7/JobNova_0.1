package com.example.jobnova_backend.repository;

import com.example.jobnova_backend.entity.Application;
import com.example.jobnova_backend.entity.Application.Status;
import com.example.jobnova_backend.entity.Job;
import com.example.jobnova_backend.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    // Prevent duplicate applications from the same user to the same job.
    boolean existsByJobAndApplicant(Job job, User applicant);

    Optional<Application> findByJobAndApplicant(
            Job job,
            User applicant
    );

    // Employer: retrieve applications for a particular job.
    Page<Application> findByJob(Job job, Pageable pageable);

    Page<Application> findByJobAndStatus(
            Job job,
            Status status,
            Pageable pageable
    );

    // Applicant: retrieve their own applications.
    Page<Application> findByApplicant(User applicant, Pageable pageable);

    Page<Application> findByApplicantAndStatus(
            User applicant,
            Status status,
            Pageable pageable
    );

    // Application statistics.
    long countByJob(Job job);

    long countByJobAndStatus(Job job, Status status);

    long countByApplicant(User applicant);

    List<Application> findByJobOrderByCreatedAtDesc(Job job);

    List<Application> findByApplicantOrderByCreatedAtDesc(User applicant);

    Optional<Application> findByIdAndApplicant(
            Long id,
            User applicant
    );
}