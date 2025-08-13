export const VERIFICATION_EMAIL = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification - HelioAI</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #0d0d0d;
        color: #ffffff;
        margin: 0;
        padding: 0;
      }
      .email-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #1a1a1a;
        border-radius: 10px;
        box-shadow: 0px 0px 20px rgba(147, 51, 234, 0.6);
        text-align: center;
      }
      .email-header {
        margin-bottom: 30px;
      }
      .logo {
        width: 100px;
        margin-bottom: 20px;
      }
      h1 {
        color: #9333ea;
        font-size: 28px;
      }
      p {
        font-size: 16px;
        color: #cfcfcf;
      }
      .verify-button {
        display: inline-block;
        padding: 15px 30px;
        margin-top: 30px;
        font-size: 18px;
        color: #ffffff; /* Ensure white text on the button */
        background-color: #9333ea;
        border-radius: 5px;
        text-decoration: none;
        box-shadow: 0 5px 15px rgba(147, 51, 234, 0.5);
        transition: background-color 0.3s ease;
      }
      .verify-button:hover {
        background-color: #7d29d0;
      }
      .footer {
        margin-top: 40px;
        font-size: 12px;
        color: #666666;
      }
      .footer a {
        color: #9333ea;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <img
          src="https://www.helioai.tech/android-chrome-512x512.png"
          alt="HelioAI Logo"
          class="logo"
        />
        <h1>Welcome to HelioAI, {NAME}!</h1>
      </div>
      <p>Hi {NAME},</p>
      <p>
        Thank you for signing up for HelioAI! You're now on your way to creating
        and deploying powerful AI chatbots in just minutes.
      </p>
      <p>
        To get started, please verify your email address by clicking the button
        below:
      </p>
      <a href="{VERIFICATION_LINK}" class="verify-button">Verify Your Email</a>
      <p>
        If you have trouble clicking the button, click on this to verify:
        <a href="{VERIFICATION_LINK}">{VERIFICATION_LINK}</a>
      </p>
      <p>
        If you didn't sign up for HelioAI, you can safely ignore this email.
      </p>
      <div class="footer">
        <p>&copy; 2024 HelioAI. All rights reserved.</p>
        <p><a href="https://www.helioai.tech">Visit our website</a></p>
      </div>
    </div>
  </body>
</html>
`;

export const resolvedQueryEmailTemplate = (queryTitle: string, resolvedAnswer: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #9333ea;
      color: #ffffff;
      padding: 15px;
      text-align: center;
      font-size: 20px;
    }
    .email-body {
      padding: 20px;
    }
    .email-footer {
      background-color: #f1f1f1;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #666;
    }
    .query, .solution {
      margin: 10px 0;
    }
    .highlight {
      color: #9333ea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      HelioAI: Your Query Has Been Resolved!
    </div>
    <div class="email-body">
      <p>Hello,</p>
      <p>Thank you for reaching out to HelioAI. We're pleased to inform you that your query has been resolved.</p>
      <div class="query">
        <strong>Your Query:</strong> <span class="highlight">${queryTitle}</span>
      </div>
      <div class="solution">
        <strong>Our Solution:</strong> <span class="highlight">${resolvedAnswer}</span>
      </div>
      <p>If you have further questions or need additional assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p><strong>The HelioAI Team</strong></p>
    </div>
    <div class="email-footer">
      © 2024 HelioAI. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
