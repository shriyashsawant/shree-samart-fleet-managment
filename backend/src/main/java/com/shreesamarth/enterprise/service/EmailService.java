package com.shreesamarth.enterprise.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

@Service
@Slf4j
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    public void sendWelcomeEmail(String toEmail, String username, String password) {
        if ("YOUR_SENDGRID_API_KEY_HERE".equals(sendGridApiKey)) {
            log.warn("SendGrid API key not configured. Mocking email to {}. Password: {}", toEmail, password);
            return;
        }

        Email from = new Email(fromEmail);
        String subject = "Welcome to Shree Samarth Enterprises - Your Account Credentials";
        Email to = new Email(toEmail);
        
        String htmlContent = String.format(
            "<html><body>" +
            "<h2>Welcome to the Fleet Management Portal</h2>" +
            "<p>Hello <strong>%s</strong>,</p>" +
            "<p>An account has been created for you at Shree Samarth Enterprises. You can now login to manage vehicles, drivers, and bills.</p>" +
            "<div style='background: #f4f4f4; padding: 20px; border-radius: 10px;'>" +
            "<p><strong>Username:</strong> %s</p>" +
            "<p><strong>Password:</strong> %s</p>" +
            "</div>" +
            "<p>Please change your password after your first login.</p>" +
            "<br/><p>Regards,<br/>Admin Team<br/>Shree Samarth Enterprises</p>" +
            "</body></html>",
            username, username, password
        );

        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            log.info("Email sent to {}. Status Code: {}", toEmail, response.getStatusCode());
        } catch (IOException ex) {
            log.error("Failed to send welcome email to {}: {}", toEmail, ex.getMessage());
        }
    }

    public void sendReminderEmail(String toEmail, String subject, String title, String description, String severity) {
        if ("YOUR_SENDGRID_API_KEY_HERE".equals(sendGridApiKey)) {
            log.warn("SendGrid API key not configured. Mocking reminder to {}: {}", toEmail, title);
            return;
        }

        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        
        String htmlContent = String.format(
            "<html><body>" +
            "<h2>Fleet Management Alert - %s</h2>" +
            "<div style='background: #fdf2f2; padding: 20px; border-radius: 10px; border-left: 5px solid %s;'>" +
            "<h3>%s</h3>" +
            "<p>%s</p>" +
            "<p><strong>Severity:</strong> %s</p>" +
            "</div>" +
            "<br/><p>Regards,<br/>Automated Monitoring System<br/>Shree Samarth Enterprises</p>" +
            "</body></html>",
            subject,
            "HIGH".equals(severity) ? "#ef4444" : "#f59e0b",
            title,
            description,
            severity
        );

        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            log.info("Reminder email sent to {}. Status Code: {}", toEmail, response.getStatusCode());
        } catch (IOException ex) {
            log.error("Failed to send reminder email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
