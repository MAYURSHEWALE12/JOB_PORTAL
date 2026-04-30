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

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.frontend.url:http://localhost:5174}")
    private String frontendUrl;

    public boolean isEmailConfigured() {
        return mailHost != null && !mailHost.isBlank() && 
               mailUsername != null && !mailUsername.isBlank() && 
               mailPassword != null && !mailPassword.isBlank();
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
                    body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
                    .wrapper { background-color: #f8fafc; padding: 40px 10px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
                    .header { background: #0f172a; padding: 60px 40px; text-align: center; }
                    .logo-icon { font-size: 40px; margin-bottom: 24px; display: block; }
                    .header h1 { color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: -0.03em; }
                    .header h1 span { color: #3b82f6; }
                    .content { padding: 50px 40px; }
                    .greeting { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
                    .text { font-size: 16px; color: #475569; line-height: 1.8; margin-bottom: 32px; }
                    .role-badge { display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 12px; padding: 12px 20px; gap: 12px; margin-bottom: 32px; border: 1px solid #e2e8f0; }
                    .role-icon { font-size: 20px; }
                    .role-text { font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; }
                    .btn { display: inline-block; background: #3b82f6; color: #ffffff !important; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.25); transition: all 0.2s; }
                    .footer { padding: 40px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; }
                    .footer p { color: #94a3b8; font-size: 13px; margin: 0 0 16px; }
                    .social-links a { color: #64748b; text-decoration: none; margin: 0 10px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <span class="logo-icon">✨</span>
                            <h1>Hire<span>Hub</span></h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Hi %s,</p>
                            <p class="text">Your journey to professional excellence starts here. We're thrilled to have you join our elite community of talent and visionary employers.</p>
                            
                            <div class="role-badge">
                                <span class="role-icon">%s</span>
                                <span class="role-text">Account: %s</span>
                            </div>
                            
                            <p class="text">Head over to your dashboard to complete your profile and start exploring opportunities tailored specifically for your expertise.</p>
                            
                            <center>
                                <a href="%s/dashboard" class="btn">Explore My Dashboard →</a>
                            </center>
                        </div>
                        <div class="footer">
                            <p>© 2026 HireHub Excellence Platform. All rights reserved.</p>
                            <div class="social-links">
                                <a href="#">Support</a>
                                <a href="#">Privacy</a>
                                <a href="#">Community</a>
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
                : "Competitive / Not specified";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
                    body { font-family: 'Outfit', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background: #3b82f6; color: white; padding: 32px; text-align: center; }
                    .header h2 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                    .body { padding: 40px; }
                    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
                    .subtitle { color: #64748b; font-size: 15px; margin-bottom: 32px; }
                    .job-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; margin-bottom: 32px; }
                    .job-title { margin: 0 0 12px; color: #0f172a; font-size: 24px; font-weight: 800; line-height: 1.2; }
                    .company-tag { display: inline-block; color: #3b82f6; font-weight: 700; font-size: 14px; margin-bottom: 24px; padding: 6px 16px; background: rgba(59, 130, 246, 0.1); border-radius: 100px; }
                    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .detail-item { font-size: 14px; color: #475569; display: flex; align-items: center; gap: 8px; }
                    .btn { display: inline-block; width: 100%%; text-align: center; padding: 18px; background: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 14px; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1); }
                    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h2>New Job Match</h2></div>
                    <div class="body">
                        <p class="greeting">Hi %s,</p>
                        <p class="subtitle">A new opportunity that perfectly aligns with your profile was just posted.</p>
                        
                        <div class="job-card">
                            <h3 class="job-title">%s</h3>
                            <div class="company-tag">%s</div>
                            
                            <div style="margin-bottom: 8px; font-size: 14px; color: #64748b;">📍 %s</div>
                            <div style="margin-bottom: 8px; font-size: 14px; color: #64748b;">💰 %s</div>
                            <div style="margin-bottom: 8px; font-size: 14px; color: #64748b;">📋 %s</div>
                            <div style="font-size: 14px; color: #64748b;">🏷️ %s</div>
                        </div>
                        
                        <a class="btn" href="%s">View & Apply Now →</a>
                    </div>
                    <div class="footer">HireHub Intelligent Matching • Manage alerts in your settings</div>
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
                        <p class="announcement">Congratulations! We are delighted to officially extend an offer for you to join organized excellence at HireHub. Your unique skills and potential have truly stood out.</p>
                        
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
                        <p>This is a secure communication from HireHub. If you have questions regarding your offer, please contact the employer through the messaging dashboard.</p>
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
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
                    body { font-family: 'Outfit', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; }
                    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); overflow: hidden; }
                    .header { background: #10b981; color: white; padding: 40px 24px; text-align: center; }
                    .header h2 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                    .body { padding: 40px; }
                    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
                    .highlight-box { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center; }
                    .highlight-box p { color: #065f46; margin: 0; font-size: 16px; font-weight: 600; line-height: 1.6; }
                    .btn { display: inline-block; padding: 16px 32px; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2); }
                    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h2>Offer Accepted!</h2></div>
                    <div class="body">
                        <p class="greeting">Hi %s,</p>
                        <p style="color: #475569;">Great news from your HireHub pipeline!</p>
                        <div class="highlight-box">
                            <p><strong>%s</strong> has officially <strong>accepted</strong> your offer for <strong>%s</strong> at <strong>%s</strong>.</p>
                        </div>
                        <p style="color: #475569; margin-bottom: 32px;">You can now log in to proceed with onboarding and next steps.</p>
                        <center><a class="btn" href="%s/dashboard">Open ATS Dashboard →</a></center>
                    </div>
                    <div class="footer">HireHub Excellence • Smart Talent Management</div>
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
            locationDetails += "<div class=\"detail-item\"><span>📍</span> <span>" + location + "</span></div>";
        }
        if (meetingLink != null && !meetingLink.isEmpty()) {
            locationDetails += "<div class=\"detail-item\"><span>💻</span> <span><a href=\"" + meetingLink + "\" style=\"color: #3b82f6; text-decoration: none; font-weight: 700;\">Join Meeting Link</a></span></div>";
        }

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                    body { font-family: 'Outfit', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                    .header { background: #3b82f6; color: white; padding: 40px 24px; text-align: center; }
                    .header h2 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                    .body { padding: 40px; }
                    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
                    .interview-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; margin: 32px 0; }
                    .interview-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 20px; }
                    .detail-item { font-size: 15px; color: #475569; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; }
                    .btn { display: inline-block; width: 100%%; text-align: center; padding: 18px; background: #3b82f6; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 14px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
                    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h2>Interview Scheduled</h2></div>
                    <div class="body">
                        <p class="greeting">Hi %s,</p>
                        <p style="color: #475569;">You've been invited to interview for the <strong>%s</strong> role at <strong>%s</strong>.</p>
                        
                        <div class="interview-box">
                            <h3 class="interview-title">%s</h3>
                            <div class="detail-item"><span>📅</span> <span><strong>Date:</strong> %s</span></div>
                            <div class="detail-item"><span>⏱️</span> <span><strong>Duration:</strong> %d minutes</span></div>
                            %s
                        </div>
                        
                        %s
                        
                        <a class="btn" href="%s/dashboard">Manage Interview in HireHub →</a>
                    </div>
                    <div class="footer">HireHub Scheduling Platform • Good luck!</div>
                </div>
            </body>
            </html>
            """.formatted(name, jobTitle, companyName, interviewTitle, dateTime, durationMinutes,
                locationDetails, description != null && !description.isEmpty() ? "<p style=\"margin-bottom:24px; color: #475569;\"><strong>Notes:</strong> " + description + "</p>" : "", frontendUrl);
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
                    .header { background: #1e293b; padding: 48px 40px; text-align: center; }
                    .logo-icon { font-size: 40px; margin-bottom: 24px; display: block; }
                    .header h1 { color: #f8fafc; font-size: 24px; margin: 0; font-weight: 800; }
                    .content { padding: 48px 40px; }
                    .greeting { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
                    .text { font-size: 16px; color: #475569; line-height: 1.7; margin-bottom: 32px; }
                    .btn { display: inline-block; background: #3b82f6; color: #ffffff !important; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
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
                        <p class="text">We received a request to reset the password for your HireHub account. Click the button below to set a new password. If you didn't request this, you can safely ignore this email.</p>
                        
                        <center>
                            <a href="%s" class="btn">Reset Password →</a>
                        </center>
                        
                        <p class="expiry">This link will expire in 1 hour for your security.</p>
                    </div>
                    <div class="footer">© 2026 HireHub • Professional Excellence</div>
                </div>
            </body>
            </html>
            """.formatted(firstName, resetUrl);
    }

    public boolean sendOTPEmail(String toEmail, String firstName, String otp, String context) {
        if (!isEmailConfigured()) {
            log.debug("Email not configured. Skipping OTP email to {}", toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Your Security Code: " + otp);
            helper.setReplyTo(fromAddress, fromName);

            message.setHeader("X-Priority", "1");
            message.setSentDate(new Date());

            String html = buildOTPEmailHtml(firstName, otp, context);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("OTP email sent to {} for context: {}", toEmail, context);
            return true;

        } catch (Exception e) {
            log.error("OTP email delivery failed to {}", toEmail, e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage());
        }
    }

    private String buildOTPEmailHtml(String firstName, String otp, String context) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
                    body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px; }
                    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                    .header { background: #0f172a; padding: 40px; text-align: center; }
                    .logo-icon { font-size: 32px; margin-bottom: 16px; display: block; }
                    .header h1 { color: #f8fafc; font-size: 20px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                    .content { padding: 40px; text-align: center; }
                    .greeting { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
                    .context-tag { display: inline-block; padding: 6px 12px; background: #f1f5f9; color: #64748b; border-radius: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 24px; }
                    .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 32px; margin: 24px 0; }
                    .otp-code { font-size: 48px; font-weight: 800; color: #3b82f6; letter-spacing: 0.2em; font-family: monospace; }
                    .instruction { font-size: 14px; color: #64748b; line-height: 1.6; }
                    .footer { padding: 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="logo-icon">🛡️</span>
                        <h1>HireHub Security</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hi %s,</p>
                        <div class="context-tag">%s</div>
                        <p class="instruction">Use the following verification code to confirm your identity. This code is sensitive and should not be shared.</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">%s</div>
                        </div>
                        
                        <p class="instruction">This code will expire in 10 minutes.</p>
                    </div>
                    <div class="footer">
                        © 2026 HireHub Excellence • Account Protection Systems
                    </div>
                </div>
            </body>
            </html>
            """.formatted(firstName, context, otp);
    }

}
