package com.jobportal.service;

import com.jobportal.entity.Job;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-name:Job Portal}")
    private String fromName;

    @Value("${app.mail.from-address:noreply@jobportal.com}")
    private String fromAddress;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.frontend.url:http://localhost:5174}")
    private String frontendUrl;

    public boolean isEmailConfigured() {
        return mailHost != null && !mailHost.isBlank();
    }

    public void sendWelcomeEmail(String toEmail, String firstName, String role) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured (spring.mail.host is empty). Skipping welcome email to {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Job Portal!");
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "3");
            message.setHeader("X-MSMail-Priority", "Normal");
            message.setHeader("Precedence", "bulk");
            message.setHeader("List-Unsubscribe", "<mailto:" + fromAddress + "?subject=unsubscribe>");
            message.setSentDate(new Date());

            String html = buildWelcomeEmailHtml(firstName, role);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Welcome email sent to {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}. In-browser notification will still work.", toEmail, e.getRootCause() != null ? e.getRootCause().getMessage() : e.getMessage());
        }
    }

    private String buildWelcomeEmailHtml(String firstName, String role) {
        String roleBadge = "JOBSEEKER".equalsIgnoreCase(role) ? "🔍 Job Seeker" : "💼 Employer";
        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                .header { background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: white; padding: 32px 24px; font-size: 24px; font-weight: 700; text-align: center; }
                .body { padding: 32px 28px; }
                .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                .badge { display: inline-block; padding: 8px 16px; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; border-radius: 20px; font-weight: 600; font-size: 13px; margin: 8px 0 24px; }
                .btn { display: inline-block; margin-top: 16px; padding: 14px 28px; background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2); }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">🎉 Welcome to Job Portal!</div>
                    <div class="body">
                        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Hi %s,</p>
                        <p>Your account has been created successfully. You're all set to get started on your professional journey!</p>
                        <div class="badge">%s</div>
                        <p>Head to your dashboard to explore all the features we've built for you.</p>
                        <center><a class="btn" href="%s/dashboard">Go to Dashboard →</a></center>
                    </div>
                    <div class="footer">Job Portal • Need help? Check out our support section</div>
                </div>
            </body>
            </html>
            """.formatted(firstName, roleBadge, frontendUrl);
    }

    public boolean sendJobAlertEmail(String toEmail, String userName, Job job) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured (spring.mail.host is empty). Skipping email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("New Job Match: " + job.getTitle() + " at " + getCompanyName(job));
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "3");
            message.setHeader("X-MSMail-Priority", "Normal");
            message.setHeader("Precedence", "bulk");
            message.setHeader("List-Unsubscribe", "<mailto:" + fromAddress + "?subject=unsubscribe>");
            message.setSentDate(new Date());

            String html = buildJobAlertEmailHtml(userName, job);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Job alert email sent to {} for job: {}", toEmail, job.getTitle());
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send job alert email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}. In-browser notification will still work.", toEmail, e.getRootCause() != null ? e.getRootCause().getMessage() : e.getMessage());
            return false;
        }
    }

    private String buildJobAlertEmailHtml(String userName, Job job) {
        String company = getCompanyName(job);
        String salary = job.getSalaryMin() != null
                ? String.format("₹%,.0f - ₹%,.0f", job.getSalaryMin(), job.getSalaryMax())
                : "Not specified";

        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                .header { background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: white; padding: 32px 24px; font-size: 22px; font-weight: 700; text-align: center; }
                .body { padding: 32px 28px; }
                .body h2 { margin: 0 0 8px; color: #0f172a; font-size: 20px; font-weight: 700; }
                .body .company { color: #0ea5e9; font-weight: 600; font-size: 14px; margin-bottom: 24px; display: inline-block; padding: 4px 12px; background: #f0f9ff; border-radius: 20px; }
                .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                .detail { margin: 12px 0; font-size: 14px; color: #334155; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #f1f5f9; display: block; }
                .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2); }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">🔔 New Job Match</div>
                    <div class="body">
                        <p style="font-size: 16px; font-weight: 600; color: #0f172a;">Hi %s,</p>
                        <p>A new job was just posted that matches your career preferences!</p>
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                            <h2>%s</h2>
                            <div class="company">%s</div>
                            <div class="detail"><strong>📍 Location:</strong> %s</div>
                            <div class="detail"><strong>💰 Salary:</strong> %s</div>
                            <div class="detail"><strong>📋 Type:</strong> %s</div>
                            <div class="detail"><strong>🏷️ Experience:</strong> %s</div>
                        </div>
                        <center><a class="btn" href="%s">View & Apply Now →</a></center>
                    </div>
                    <div class="footer">Job Portal • Manage alerts in your dashboard</div>
                </div>
            </body>
            </html>
            """.formatted(
                userName,
                job.getTitle(),
                company,
                job.getLocation(),
                salary,
                job.getJobType() != null ? job.getJobType() : "Full-time",
                job.getExperienceRequired() != null ? job.getExperienceRequired() : "Not specified",
                "" + frontendUrl + "/jobs/" + job.getId()
            );
    }

    private String getCompanyName(Job job) {
        if (job.getEmployer() != null && job.getEmployer().getCompanyProfile() != null) {
            return job.getEmployer().getCompanyProfile().getCompanyName();
        }
        if (job.getEmployer() != null) {
            return job.getEmployer().getFirstName() + " " + job.getEmployer().getLastName();
        }
        return "Unknown Company";
    }

    public boolean sendOfferLetterEmail(String toEmail, String candidateName, String jobTitle, String companyName, String offerContent, String subject) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping offer letter email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setHeader("X-MSMail-Priority", "High");
            message.setSentDate(new Date());

            String html = buildOfferLetterEmailHtml(candidateName, jobTitle, companyName, offerContent);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Offer letter email sent to {} for job: {}", toEmail, jobTitle);
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send offer letter email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildOfferLetterEmailHtml(String candidateName, String jobTitle, String companyName, String offerContent) {
        String formattedContent = offerContent != null
                ? offerContent.replace("\n", "<br>").replace("  ", "&nbsp;&nbsp;")
                : "Please check your dashboard for the offer details.";

        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                .header { background: linear-gradient(135deg, #10b981 0%%, #34d399 100%%); color: white; padding: 32px 24px; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.5px; }
                .body { padding: 32px 28px; }
                .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                .offer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 14px; white-space: pre-wrap; line-height: 1.8; color: #1e293b; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02); }
                .btn { display: inline-block; margin-top: 16px; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%%, #10b981 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">🎉 Congratulations!</div>
                    <div class="body">
                        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Dear %s,</p>
                        <p>We are pleased to officially share your offer letter for the position of <strong>%s</strong> at <strong>%s</strong>.</p>
                        <div class="offer-box">%s</div>
                        <p>Please log in to your dashboard to review and securely respond to this offer.</p>
                        <center><a class="btn" href="%s/dashboard">Review in Dashboard →</a></center>
                    </div>
                    <div class="footer">Job Portal • Need help? Check out our support section</div>
                </div>
            </body>
            </html>
            """.formatted(candidateName, jobTitle, companyName, formattedContent, frontendUrl);
    }

    public boolean sendOfferAcceptedEmail(String toEmail, String employerName, String candidateName, String jobTitle, String companyName) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping offer accepted email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Offer Accepted: " + candidateName + " - " + jobTitle + " at " + companyName);
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setSentDate(new Date());

            String html = buildOfferAcceptedEmailHtml(employerName, candidateName, jobTitle, companyName);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Offer accepted email sent to {} for candidate: {}", toEmail, candidateName);
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send offer accepted email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildOfferAcceptedEmailHtml(String employerName, String candidateName, String jobTitle, String companyName) {
        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                .header { background: linear-gradient(135deg, #10b981 0%%, #34d399 100%%); color: white; padding: 32px 24px; font-size: 24px; font-weight: 700; text-align: center; }
                .body { padding: 32px 28px; }
                .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                .highlight-box { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
                .highlight-box p { color: #065f46; margin: 0; font-size: 16px; font-weight: 500; }
                .btn { display: inline-block; margin-top: 16px; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%%, #10b981 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">✅ Offer Accepted!</div>
                    <div class="body">
                        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Hi %s,</p>
                        <p>Great news from your ATS pipeline!</p>
                        <div class="highlight-box">
                            <p><strong>%s</strong> has officially <strong>accepted</strong> your offer for the position of <strong>%s</strong> at <strong>%s</strong>.</p>
                        </div>
                        <p>You can now log in and proceed with their onboarding process.</p>
                        <center><a class="btn" href="%s/dashboard">Open ATS Board →</a></center>
                    </div>
                    <div class="footer">Job Portal • Need help? Check out our support section</div>
                </div>
            </body>
            </html>
            """.formatted(employerName, candidateName, jobTitle, companyName, frontendUrl);
    }

    public boolean sendInterviewScheduledEmail(String toEmail, String name, String interviewTitle,
                                                String jobTitle, String companyName,
                                                java.time.LocalDateTime scheduledAt,
                                                int durationMinutes, String location,
                                                String meetingLink, String description) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping interview email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Interview Scheduled: " + interviewTitle);
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setSentDate(new Date());

            String html = buildInterviewEmailHtml(name, interviewTitle, jobTitle, companyName,
                    scheduledAt, durationMinutes, location, meetingLink, description);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Interview email sent to {} for: {}", toEmail, interviewTitle);
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send interview email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildInterviewEmailHtml(String name, String interviewTitle, String jobTitle,
                                           String companyName, java.time.LocalDateTime scheduledAt,
                                           int durationMinutes, String location,
                                           String meetingLink, String description) {
        String dateTime = scheduledAt.format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a"));
        String locationDetails = "";
        if (location != null && !location.isEmpty()) {
            locationDetails += "<div class=\"detail\"><span>📍</span> <span>" + location + "</span></div>";
        }
        if (meetingLink != null && !meetingLink.isEmpty()) {
            locationDetails += "<div class=\"detail\"><span>💻</span> <span><a href=\"" + meetingLink + "\">" + meetingLink + "</a></span></div>";
        }

        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                .header { background: linear-gradient(135deg, #3b82f6 0%%, #60a5fa 100%%); color: white; padding: 32px 24px; font-size: 24px; font-weight: 700; text-align: center; }
                .body { padding: 32px 28px; }
                .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                .detail { margin: 12px 0; font-size: 15px; color: #334155; background: #f8fafc; padding: 14px 18px; border-radius: 10px; border: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 12px; }
                .detail span:first-child { font-size: 18px; line-height: 1.2; }
                .detail a { color: #3b82f6; text-decoration: none; font-weight: 600; }
                .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%%, #3b82f6 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
                .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">📅 Interview Scheduled</div>
                    <div class="body">
                        <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Hi %s,</p>
                        <p>You have been invited to an interview for the <strong>%s</strong> role at <strong>%s</strong>!</p>
                        <div style="margin: 24px 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <h2 style="margin:0 0 16px; font-size: 18px; color:#1e293b;">%s</h2>
                            <div class="detail"><span>📅</span> <span><strong>Date & Time:</strong><br/>%s</span></div>
                            <div class="detail"><span>⏱️</span> <span><strong>Duration:</strong><br/>%d minutes</span></div>
                            %s
                            %s
                        </div>
                        <center><a class="btn" href="%s/dashboard">View in Dashboard →</a></center>
                    </div>
                    <div class="footer">Job Portal • Manage your interviews in the dashboard</div>
                </div>
            </body>
            </html>
            """.formatted(name, jobTitle, companyName, interviewTitle, dateTime, durationMinutes,
                locationDetails, description != null && !description.isEmpty() ? "<p style=\"margin-top:16px;\"><strong>Notes:</strong> " + description + "</p>" : "", frontendUrl);
    }

    public boolean sendInterviewReminderEmail(String toEmail, String name, String interviewTitle,
                                              String jobTitle, String companyName,
                                              java.time.LocalDateTime scheduledAt,
                                              String location, String meetingLink) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping reminder to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("⏰ Interview Reminder: " + interviewTitle);
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setSentDate(new Date());

            String dateTime = scheduledAt.format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a"));
            String linkHtml = "";
            if (meetingLink != null && !meetingLink.isEmpty()) {
                linkHtml = "<a class=\"btn\" href=\"" + meetingLink + "\" style=\"background:#10b981;\">Join Meeting →</a>";
            }

            String html = """
                <!DOCTYPE html>
                <html>
                <head><style>
                    body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
                    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: white; padding: 32px 24px; font-size: 24px; font-weight: 700; text-align: center; }
                    .body { padding: 32px 28px; }
                    .body p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px; }
                    .detail { margin: 12px 0; font-size: 15px; color: #334155; background: #f8fafc; padding: 14px 18px; border-radius: 10px; border: 1px solid #f1f5f9; }
                    .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #0ea5e9 0%%, #0284c7 100%%); color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2); }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style></head>
                <body>
                    <div class="container">
                        <div class="header">⏰ Interview Reminder</div>
                        <div class="body">
                            <p style="font-size: 18px; font-weight: 600; color: #0f172a;">Hi %s,</p>
                            <p>This is a friendly reminder for your upcoming interview for the <strong>%s</strong> role at <strong>%s</strong>!</p>
                            <div style="margin: 24px 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <h2 style="margin:0 0 16px; font-size: 18px; color:#1e293b;">%s</h2>
                                <div class="detail"><strong>📅 Date & Time:</strong><br/>%s</div>
                                %s
                            </div>
                            <center>%s</center>
                        </div>
                        <div class="footer">Job Portal • Good luck with your interview!</div>
                    </div>
                </body>
                </html>
                """.formatted(name, jobTitle, companyName, interviewTitle, dateTime,
                    location != null && !location.isEmpty() ? "<div class=\"detail\">📍 " + location + "</div>" : "",
                    linkHtml);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Interview reminder sent to {}", toEmail);
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send interview reminder to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
