export const otpMessage = (userName, otpCode, expiryMinutes = 10) => {
  const template = `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
      <h1 style="color: #1a73e8; margin: 0; font-size: 28px;">Livik</h1>
      <p style="color: #666; margin: 5px 0 0 0;">Secure Access Verification</p>
    </div>

    <!-- Greeting -->
    <div style="padding: 30px 0;">
      <h2 style="color: #333; margin-bottom: 20px;">
        Hello ${userName || 'User'},
      </h2>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        You've requested a One-Time Password (OTP) to access your Livik account. 
        Use the code below to complete your verification:
      </p>
    </div>

    <!-- OTP Display -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 12px; 
                padding: 30px; 
                text-align: center; 
                margin: 30px 0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      
      <p style="color: white; font-size: 14px; margin: 0 0 15px 0; font-weight: bold; letter-spacing: 1px;">
        YOUR VERIFICATION CODE
      </p>
      
      <div style="background: white; 
                  padding: 20px; 
                  border-radius: 8px; 
                  display: inline-block;
                  min-width: 250px;">
        <h1 style="color: #1a73e8; 
                   font-size: 42px; 
                   letter-spacing: 10px; 
                   margin: 0; 
                   font-weight: bold;
                   font-family: 'Courier New', monospace;">
          ${otpCode}
        </h1>
      </div>
      
      <p style="color: rgba(255,255,255,0.9); 
                font-size: 14px; 
                margin: 15px 0 0 0;">
        Valid for ${expiryMinutes} minutes only
      </p>
    </div>

    <!-- Instructions -->
    <div style="background-color: #f8f9fa; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 30px 0;">
      <h3 style="color: #333; margin-top: 0;">Important Instructions:</h3>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Enter this code on the verification page</li>
        <li style="margin-bottom: 10px;">Do not share this code with anyone</li>
        <li style="margin-bottom: 10px;">The code will expire in ${expiryMinutes} minutes</li>
        <li>If you didn't request this code, please ignore this email</li>
      </ul>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://livik-internal-tool-sigma.vercel.app/verify-otp" 
         target="_blank"
         style="background-color: #1a73e8;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;">
        Go to Verification Page
      </a>
    </div>

    <!-- Security Warning -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
        <strong>Security Notice:</strong> Livik will never ask for your password or OTP via email, 
        phone, or SMS. This OTP is for your use only.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        This is an automated message. Please do not reply to this email.
      </p>
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        Need help? Contact our support team at 
        <a href="mailto:support@livik.com" style="color: #1a73e8;">support@livik.com</a>
      </p>
      <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
        © ${new Date().getFullYear()} Livik. All rights reserved.
      </p>
    </div>

  </div>
  `;
  return template;
};

// Alternative simple version for password reset
export const passwordResetOTPMessage = (userName, otpCode) => {
  const template = `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
    
    <h2 style="color: #333;">Password Reset Request</h2>
    
    <p>Hello ${userName},</p>
    
    <p>We received a request to reset your Livik account password. Use the OTP below to verify your identity:</p>
    
    <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
      <h1 style="color: #1a73e8; margin: 0; letter-spacing: 8px;">${otpCode}</h1>
    </div>
    
    <p><strong>This OTP is valid for 10 minutes only.</strong></p>
    
    <p>If you didn't request a password reset, please ignore this email or contact support immediately.</p>
    
    <p>Best regards,<br>Team Livik</p>
    
  </div>
  `;
  return template;
};

// Welcome/verification OTP template
export const welcomeOTPMessage = (userName, otpCode) => {
  const template = `
  <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #f8f9fa, #ffffff);">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a73e8; margin: 0;">🎉 Welcome to Livik!</h1>
      <p style="color: #666; margin-top: 10px;">Complete your account verification</p>
    </div>
    
    <p>Hello ${userName},</p>
    
    <p>Thank you for joining Livik! To activate your account and ensure security, please verify your email address using the OTP below:</p>
    
    <div style="background: white; 
                border: 2px dashed #1a73e8; 
                padding: 25px; 
                text-align: center; 
                margin: 30px 0;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      <div style="color: #666; margin-bottom: 10px; font-size: 14px;">Verification Code:</div>
      <div style="font-size: 36px; 
                  font-weight: bold; 
                  color: #1a73e8; 
                  letter-spacing: 8px;
                  font-family: monospace;">
        ${otpCode}
      </div>
    </div>
    
    <p style="background-color: #e8f4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #1a73e8;">
      <strong>Next Steps:</strong><br>
      1. Copy the verification code above<br>
      2. Return to Livik verification page<br>
      3. Enter the code to complete your registration
    </p>
    
    <p style="margin-top: 30px;">
      <a href="https://livik-internal-tool-sigma.vercel.app/verify-email" 
         style="background-color: #1a73e8; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px;
                display: inline-block;">
        Complete Verification
      </a>
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #999; font-size: 12px;">
        If you have any questions, contact our support team at 
        <a href="mailto:support@livik.com" style="color: #1a73e8;">support@livik.com</a>
      </p>
    </div>
    
  </div>
  `;
  return template;
};

export const payrollCreatedMessage = (userName, month, year) => {
  const template = `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #1a73e8; margin: 0;">Payroll Created</h1>
      <p style="color: #666; margin-top: 5px;">${month} ${year}</p>
    </div>
    
    <p>Hello <strong>${userName}</strong>,</p>
    
    <p>We are pleased to inform you that the payroll for <strong>${month} ${year}</strong> has been processed and created successfully.</p>
    
    <p>You can now view your payslip details in the Employee Portal.</p>
    
    
    
    <p style="color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
      This is an automated notification. If you have any questions regarding your payroll, please contact the HR department.
    </p>
    
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Livik. All rights reserved.</p>
    </div>
  </div>
  `;
  return template;
};
