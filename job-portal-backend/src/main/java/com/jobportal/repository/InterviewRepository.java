package com.jobportal.repository;

import com.jobportal.entity.Interview;
import com.jobportal.entity.InterviewStatus;
import com.jobportal.entity.JobApplication;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByApplication(JobApplication application);

    List<Interview> findByCandidate(User candidate);

    List<Interview> findByInterviewer(User interviewer);

    List<Interview> findByStatus(InterviewStatus status);

    List<Interview> findByCandidateId(Long candidateId);

    List<Interview> findByInterviewerId(Long interviewerId);

    @Query("SELECT i FROM Interview i WHERE i.scheduledAt BETWEEN :start AND :end AND i.status = :status")
    List<Interview> findByScheduledAtBetweenAndStatus(@Param("start") LocalDateTime start,
                                                      @Param("end") LocalDateTime end,
                                                      @Param("status") InterviewStatus status);

    @Query("SELECT i FROM Interview i WHERE i.scheduledAt <= :time AND i.status IN :statuses AND i.reminderSent24h = false")
    List<Interview> findUpcoming24hReminders(@Param("time") LocalDateTime time,
                                             @Param("statuses") List<InterviewStatus> statuses);

    @Query("SELECT i FROM Interview i WHERE i.scheduledAt <= :time AND i.status IN :statuses AND i.reminderSent1h = false")
    List<Interview> findUpcoming1hReminders(@Param("time") LocalDateTime time,
                                            @Param("statuses") List<InterviewStatus> statuses);
}
