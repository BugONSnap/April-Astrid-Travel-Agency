import { Resend } from 'resend';
import { env } from 'process';

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
	if (!env.RESEND_API_KEY) {
		console.error('RESEND_API_KEY is not set in environment variables');
		throw new Error('Email service is not configured');
	}

	const resend = new Resend(env.RESEND_API_KEY);
	const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@resend.dev';

	const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #f9f9f9;
      }
      .header {
        background: #dc2626;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        background: #dc2626;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
      .warning {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12px;
        margin: 20px 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>You requested a password reset for your April-Astrid Travel Agency account.</p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you did not request this reset, please ignore this email.
        </div>

        <p>Click the button below to reset your password:</p>
        
        <center>
          <a href="${resetLink}" class="button">Reset Password</a>
        </center>

        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
          ${resetLink}
        </p>

        <p>If you have any issues, please contact our support team.</p>

        <p>Best regards,<br><strong>April-Astrid Travel Agency</strong></p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply directly to this message.</p>
        <p>&copy; April-Astrid Travel Agency. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
	`.trim();

	try {
		const response = await resend.emails.send({
			from: fromEmail,
			to: email,
			subject: 'Password Reset Request - April-Astrid Travel Agency',
			html: emailHtml,
		});

		if (response.error) {
			console.error('Resend error:', response.error);
			throw new Error(`Failed to send email: ${response.error.message}`);
		}

		console.log(`Password reset email sent to ${email}. ID: ${response.data?.id}`);
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw error;
	}
}
