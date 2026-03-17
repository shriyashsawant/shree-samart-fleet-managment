package com.shreesamarth.enterprise.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final String FROM_EMAIL = "shreesamarthenterprises@gmail.com";
    private static final String FROM_NAME = "Shree Samarth Enterprises";
    
    private final SendGrid sendGrid;

    /**
     * Send email to a single recipient
     */
    public boolean sendEmail(String to, String subject, String body) {
        try {
            Email from = new Email(FROM_EMAIL, FROM_NAME);
            Email toEmail = new Email(to);
            
            Mail mail = new Mail(from, subject, toEmail, new Content("text/html", body));
            
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sendGrid.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to: {}", to);
                return true;
            } else {
                log.error("Failed to send email. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (IOException e) {
            log.error("Error sending email to {}: {}", to, e.getMessage());
            return false;
        }
    }

    /**
     * Send email to multiple recipients
     */
    public boolean sendEmailToMultiple(String[] toEmails, String subject, String body) {
        try {
            Email from = new Email(FROM_EMAIL, FROM_NAME);
            
            for (String to : toEmails) {
                Email toEmail = new Email(to);
                Mail mail = new Mail(from, subject, toEmail, new Content("text/html", body));
                
                Request request = new Request();
                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");
                request.setBody(mail.build());
                
                Response response = sendGrid.api(request);
                
                if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                    log.info("Email sent successfully to: {}", to);
                } else {
                    log.error("Failed to send email to {}. Status: {}", to, response.getStatusCode());
                }
            }
            return true;
        } catch (IOException e) {
            log.error("Error sending emails: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send reminder email with formatted HTML content
     */
    public boolean sendReminderEmail(String to, String reminderType, String title, String description, String severity) {
        String color = "green";
        if ("HIGH".equals(severity)) {
            color = "red";
        } else if ("MEDIUM".equals(severity)) {
            color = "orange";
        }

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .alert { padding: 15px; border-left: 4px solid %s; background-color: white; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Shree Samarth Enterprises</h1>
                        <p>Fleet Management Alert</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #1e3a8a;">%s</h2>
                        <div class="alert">
                            <p><strong>Description:</strong> %s</p>
                            <p><strong>Severity:</strong> <span style="color: %s; font-weight: bold;">%s</span></p>
                        </div>
                        <p>Please take necessary action.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated alert from Shree Samarth Enterprises Fleet Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """, color, title, description, color, severity);

        return sendEmail(to, "⚠️ " + reminderType + " Alert - " + title, htmlContent);
    }

    /**
     * Send bill notification email
     */
    public boolean sendBillNotification(String to, String billNo, String partyName, String totalAmount, String date) {
        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .bill-details { background-color: white; padding: 15px; border-radius: 5px; }
                    .total { font-size: 24px; font-weight: bold; color: #059669; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧾 New Bill Generated</h1>
                        <p>Shree Samarth Enterprises</p>
                    </div>
                    <div class="content">
                        <h3>Bill Details</h3>
                        <div class="bill-details">
                            <p><strong>Bill No:</strong> %s</p>
                            <p><strong>Party Name:</strong> %s</p>
                            <p><strong>Date:</strong> %s</p>
                            <p class="total">Total Amount: ₹%s</p>
                        </div>
                        <p>Please find the bill attached or available in the system.</p>
                    </div>
                    <div class="footer">
                        <p>Generated by Shree Samarth Enterprises Fleet Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """, billNo, partyName, date, totalAmount);

        return sendEmail(to, "🧾 Bill Generated - " + billNo + " - ₹" + totalAmount, htmlContent);
    }

    /**
     * Send monthly GST digest email
     */
    public boolean sendGstDigest(String to, String month, String totalBilling, String totalGst, String totalBills) {
        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .summary { background-color: white; padding: 20px; border-radius: 5px; }
                    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .metric:last-child { border-bottom: none; }
                    .value { font-weight: bold; color: #7c3aed; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Monthly GST Digest</h1>
                        <p>Shree Samarth Enterprises - %s</p>
                    </div>
                    <div class="content">
                        <h3>GST Summary for %s</h3>
                        <div class="summary">
                            <div class="metric">
                                <span>Total Bills Generated:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="metric">
                                <span>Total Billing Amount:</span>
                                <span class="value">₹%s</span>
                            </div>
                            <div class="metric">
                                <span>Total GST Collected:</span>
                                <span class="value">₹%s</span>
                            </div>
                        </div>
                        <p>Please review the attached GST reports for detailed breakdown.</p>
                    </div>
                    <div class="footer">
                        <p>Generated by Shree Samarth Enterprises Fleet Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """, month, month, totalBills, totalBilling, totalGst);

        return sendEmail(to, "📊 Monthly GST Digest - " + month, htmlContent);
    }

    /**
     * Send salary slip notification
     */
    public boolean sendSalarySlip(String to, String driverName, String month, String amount, String vehicleNumber) {
        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .slip { background-color: white; padding: 20px; border-radius: 5px; }
                    .amount { font-size: 28px; font-weight: bold; color: #059669; text-align: center; padding: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 Salary Slip Generated</h1>
                        <p>Shree Samarth Enterprises</p>
                    </div>
                    <div class="content">
                        <h3>Salary Slip - %s</h3>
                        <div class="slip">
                            <p><strong>Driver Name:</strong> %s</p>
                            <p><strong>Vehicle:</strong> %s</p>
                            <p><strong>Month:</strong> %s</p>
                            <div class="amount">₹%s</div>
                        </div>
                        <p>Your salary has been processed. Please contact the management for any queries.</p>
                    </div>
                    <div class="footer">
                        <p>Generated by Shree Samarth Enterprises Fleet Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """, month, driverName, vehicleNumber, month, amount);

        return sendEmail(to, "💰 Salary Slip - " + month + " - ₹" + amount, htmlContent);
    }
}
