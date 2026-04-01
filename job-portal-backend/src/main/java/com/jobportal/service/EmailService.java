package com.jobportal.service;

import com.jobportal.entity.Job;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    public boolean isEmailConfigured() {
        return mailHost != null && !mailHost.isBlank();
    }

    public boolean sendWelcomeEmail(String toEmail, String firstName, String role) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured (spring.mail.host is empty). Skipping welcome email to {}", toEmail);
            return false;
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
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}. In-browser notification will still work.", toEmail, e.getRootCause() != null ? e.getRootCause().getMessage() : e.getMessage());
            return false;
        }
    }

    private String buildWelcomeEmailHtml(String firstName, String role) {
        String roleBadge = "JOBSEEKER".equalsIgnoreCase(role) ? "🔍 Job Seeker" : "💼 Employer";
        return """
            <!DOCTYPE html>
            <html>
            <head><style>
                body { font-family: Arial, sans-serif; background: #fdf2f0; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border: 3px solid #1c1917; box-shadow: 6px 6px 0 #ea580c; }
                .header { background: #ea580c; color: white; padding: 24px; font-size: 22px; font-weight: bold; text-align: center; }
                .body { padding: 28px; }
                .body h2 { margin: 0 0 12px; color: #1c1917; font-size: 20px; }
                .body p { color: #374151; font-size: 14px; line-height: 1.6; }
                .badge { display: inline-block; padding: 6px 14px; background: #f5f5f4; border: 2px solid #1c1917; font-weight: bold; font-size: 13px; margin: 8px 0 16px; }
                .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #ea580c; color: white; text-decoration: none; font-weight: bold; border: 2px solid #1c1917; }
                .footer { background: #f5f5f4; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 2px solid #e7e5e4; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">🎉 Welcome to Job Portal!</div>
                    <div class="body">
                        <p>Hi %s,</p>
                        <p>Your account has been created successfully. You're all set to get started!</p>
                        <div class="badge">%s</div>
                        <p>Head to your dashboard to explore all the features we've built for you.</p>
                        <a class="btn" href="http://localhost:5173/dashboard">Go to Dashboard →</a>
                    </div>
                    <div class="footer">Job Portal • Need help? Check out our support section</div>
                </div>
            </body>
            </html>
            """.formatted(firstName, roleBadge);
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
                body { font-family: Arial, sans-serif; background: #fdf2f0; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border: 3px solid #1c1917; box-shadow: 6px 6px 0 #ea580c; }
                .header { background: #ea580c; color: white; padding: 20px; font-size: 20px; font-weight: bold; }
                .body { padding: 24px; }
                .body h2 { margin: 0 0 8px; color: #1c1917; font-size: 18px; }
                .body .company { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
                .detail { display: flex; gap: 8px; margin: 6px 0; font-size: 14px; color: #374151; }
                .detail span:first-child { min-width: 20px; }
                .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; font-weight: bold; border: 2px solid #1c1917; }
                .footer { background: #f5f5f4; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 2px solid #e7e5e4; }
            </style></head>
            <body>
                <div class="container">
                    <div class="header">🔔 New Job Match!</div>
                    <div class="body">
                        <p>Hi %s,</p>
                        <p>A new job matches your preferences:</p>
                        <h2>%s</h2>
                        <div class="company">%s</div>
                        <div class="detail"><span>📍</span> <span>%s</span></div>
                        <div class="detail"><span>💰</span> <span>%s</span></div>
                        <div class="detail"><span>📋</span> <span>%s</span></div>
                        <div class="detail"><span>🏷️</span> <span>%s</span></div>
                        <a class="btn" href="%s">View & Apply →</a>
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
                "http://localhost:5173/jobs/" + job.getId()
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
}
