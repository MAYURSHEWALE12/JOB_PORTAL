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
        String roleIcon = "JOBSEEKER".equalsIgnoreCase(role) ? "🔍" : "💼";
        String roleLabel = "JOBSEEKER".equalsIgnoreCase(role) ? "Job Seeker" : "Employer";
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
                    body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
                    .wrapper { background-color: #f0f4f8; padding: 40px 10px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #0f172a 0%%, #1e293b 100%%); padding: 48px 40px; text-align: center; }
                    .logo-icon { font-size: 40px; margin-bottom: 24px; display: block; }
                    .header h1 { color: #f8fafc; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.02em; }
                    .content { padding: 48px 40px; }
                    .greeting { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
                    .text { font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 32px; }
                    .role-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px; display: flex; align-items: center; gap: 16px; }
                    .role-icon { font-size: 24px; padding: 12px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .role-info h3 { margin: 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }
                    .role-info p { margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #0f172a; }
                    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; transition: transform 0.2s; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }
                    .footer { padding: 32px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; }
                    .footer p { color: #94a3b8; font-size: 13px; margin: 0; }
                    .social-links { margin-top: 16px; }
                    .social-links a { color: #64748b; text-decoration: none; margin: 0 8px; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <span class="logo-icon">🚀</span>
                            <h1>Welcome to Vertex Job Portal</h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Hi %s,</p>
                            <p class="text">Your journey to professional excellence starts here. We're thrilled to have you join our elite community of talent and visionary employers.</p>
                            
                            <div class="role-card">
                                <span class="role-icon">%s</span>
                                <div class="role-info">
                                    <h3>Account Type</h3>
                                    <p>%s</p>
                                </div>
                            </div>
                            
                            <p class="text">Head over to your dashboard to complete your profile and start exploring opportunities tailored for you.</p>
                            
                            <center>
                                <a href="%s/dashboard" class="btn">Explore My Dashboard →</a>
                            </center>
                        </div>
                        <div class="footer">
                            <p>© 2026 Vertex Job Portal. All rights reserved.</p>
                            <div class="social-links">
                                <a href="#">Support</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(firstName, roleIcon, roleLabel, frontendUrl);
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
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
                    body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #f7fee7; margin: 0; padding: 40px 10px; }
                    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.12); border: 1px solid #d9f99d; }
                    .header { background: #166534; padding: 64px 40px; text-align: center; position: relative; }
                    .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: #4ade80; }
                    .confetti { font-size: 48px; margin-bottom: 24px; display: block; }
                    .header h1 { color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: -0.03em; }
                    .content { padding: 56px 48px; }
                    .doc-tag { display: inline-block; background: #f0fdf4; color: #166534; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 24px; border: 1px solid #bbf7d0; }
                    .greeting { font-size: 22px; font-weight: 700; color: #064e3b; margin-bottom: 12px; }
                    .announcement { font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 40px; }
                    .role-highlight { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px; padding: 32px; margin-bottom: 40px; }
                    .role-item { margin-bottom: 20px; }
                    .role-item:last-child { margin-bottom: 0; }
                    .role-label { font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
                    .role-value { font-size: 18px; color: #0f172a; font-weight: 700; }
                    .offer-details { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 40px; }
                    .btn { display: inline-block; background: #166534; color: #ffffff !important; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 15px 30px rgba(22, 101, 52, 0.2); }
                    .footer { padding: 40px; text-align: center; font-size: 13px; color: #64748b; background: #f8fafc; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="confetti">✨</span>
                        <h1>You've Got an Official Offer!</h1>
                    </div>
                    <div class="content">
                        <span class="doc-tag">Confidential Offer</span>
                        <p class="greeting">Dear %s,</p>
                        <p class="announcement">Congratulations! We are delighted to officially extend an offer for you to join organized excellence. Your unique skills and potential have truly stood out.</p>
                        
                        <div class="role-highlight">
                            <div class="role-item">
                                <span class="role-label">Position</span>
                                <span class="role-value">%s</span>
                            </div>
                            <div style="height: 1px; background: #e2e8f0; margin: 16px 0;"></div>
                            <div class="role-item">
                                <span class="role-label">Organization</span>
                                <span class="role-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="offer-details">
                            %s
                        </div>
                        
                        <center>
                            <a href="%s/dashboard" class="btn">View & Accept Offer →</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p>This is a secure communication from Vertex Job Portal. If you have questions regarding your offer, please contact the employer through the messaging dashboard.</p>
                    </div>
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
    public boolean sendPasswordResetEmail(String toEmail, String firstName, String token) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping password reset email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - Job Portal");
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setSentDate(new Date());

            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            String html = buildPasswordResetEmailHtml(firstName, resetUrl);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
            return true;

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (MailException e) {
            log.warn("Mail server error for {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildPasswordResetEmailHtml(String firstName, String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
                    body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #1e293b 0%%, #334155 100%%); padding: 48px 40px; text-align: center; }
                    .logo-icon { font-size: 40px; margin-bottom: 24px; display: block; }
                    .header h1 { color: #f8fafc; font-size: 24px; margin: 0; font-weight: 800; }
                    .content { padding: 48px 40px; }
                    .greeting { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
                    .text { font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 32px; }
                    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }
                    .expiry { font-size: 13px; color: #94a3b8; margin-top: 32px; text-align: center; }
                    .footer { padding: 32px 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 13px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="logo-icon">🔐</span>
                        <h1>Reset Your Password</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hi %s,</p>
                        <p class="text">We received a request to reset the password for your Job Portal account. Click the button below to set a new password. If you didn't request this, you can safely ignore this email.</p>
                        
                        <center>
                            <a href="%s" class="btn">Reset Password →</a>
                        </center>
                        
                        <p class="expiry">This link will expire in 1 hour for your security.</p>
                    </div>
                    <div class="footer">© 2026 Vertex Job Portal • Professional Excellence</div>
                </div>
            </body>
            </html>
            """.formatted(firstName, resetUrl);
    }
}
