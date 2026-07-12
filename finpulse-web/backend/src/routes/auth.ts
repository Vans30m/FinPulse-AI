import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { yahooFinance } from '../index.js';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

const SMTP_SEND_TIMEOUT_MS = 15_000;

async function sendOtpEmail(email: string, code: string) {
  console.log(`✉️ [sendOtpEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES (starts with " + process.env.BREVO_API_KEY.substring(0, 10) + ")" : "NO"}`);
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`✉️ Attempting to send OTP email to ${email} via Brevo API...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'FinPulse AI',
            email: process.env.SENDER_EMAIL || 'afinpulse@gmail.com',
          },
          to: [{ email }],
          subject: 'Verify your FinPulse AI Account',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0284c7;">Verify your FinPulse AI Account</h2>
              <p>Thank you for signing up for FinPulse AI. Please use the following 6-digit verification code to complete your registration:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      console.log(`✉️ OTP email sent to ${email} successfully via Brevo API`);
      return;
    } catch (error) {
      console.error(`Failed to send OTP email via Brevo API to ${email}:`, error);
      console.log('Falling back to other configurations...');
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`✉️ Attempting to send OTP email to ${email} via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinPulse AI <onboarding@resend.dev>',
          to: email,
          subject: 'Verify your FinPulse AI Account',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0284c7;">Verify your FinPulse AI Account</h2>
              <p>Thank you for signing up for FinPulse AI. Please use the following 6-digit verification code to complete your registration:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      console.log(`✉️ OTP email sent to ${email} successfully via Resend API`);
      return;
    } catch (error) {
      console.error(`Failed to send OTP email via Resend API to ${email}:`, error);
      console.log('Falling back to SMTP configuration...');
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n==========================================`);
    console.log(`✉️  [OTP Fallback] Verification code for ${email}: ${code}`);
    console.log(`==========================================\n`);
    return;
  }

  try {
    await Promise.race([
      transporter.sendMail({
        from: `"FinPulse AI" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your FinPulse AI Account',
        text: `Your 6-digit verification code is: ${code}. It expires in 10 minutes.`,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0284c7;">Verify your FinPulse AI Account</h2>
          <p>Thank you for signing up for FinPulse AI. Please use the following 6-digit verification code to complete your registration:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP send timed out')), SMTP_SEND_TIMEOUT_MS)
      ),
    ]);
    console.log(`✉️ OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
  }
}

function queueOtpEmail(email: string, code: string) {
  void sendOtpEmail(email, code);
}

async function sendResetPasswordEmail(email: string, code: string) {
  console.log(`✉️ [sendResetPasswordEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES (starts with " + process.env.BREVO_API_KEY.substring(0, 10) + ")" : "NO"}`);
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`✉️ Attempting to send reset password email to ${email} via Brevo API...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'FinPulse AI',
            email: process.env.SENDER_EMAIL || 'afinpulse@gmail.com',
          },
          to: [{ email }],
          subject: 'Reset your FinPulse AI Password',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0284c7;">Reset your FinPulse AI Password</h2>
              <p>We received a request to reset your password. Please use the following 6-digit verification code to complete the reset:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      console.log(`✉️ Reset password email sent to ${email} successfully via Brevo API`);
      return;
    } catch (error) {
      console.error(`Failed to send reset password email via Brevo API to ${email}:`, error);
      console.log('Falling back to other configurations...');
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`✉️ Attempting to send reset password email to ${email} via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinPulse AI <onboarding@resend.dev>',
          to: email,
          subject: 'Reset your FinPulse AI Password',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0284c7;">Reset your FinPulse AI Password</h2>
              <p>We received a request to reset your password. Please use the following 6-digit verification code to complete the reset:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
                ${code}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      console.log(`✉️ Reset password email sent to ${email} successfully via Resend API`);
      return;
    } catch (error) {
      console.error(`Failed to send reset password email via Resend API to ${email}:`, error);
      console.log('Falling back to SMTP configuration...');
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n==========================================`);
    console.log(`✉️  [Reset Password Fallback] Verification code for ${email}: ${code}`);
    console.log(`==========================================\n`);
    return;
  }

  try {
    await Promise.race([
      transporter.sendMail({
        from: `"FinPulse AI" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your FinPulse AI Password',
        text: `Your 6-digit verification code to reset your password is: ${code}. It expires in 10 minutes.`,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0284c7;">Reset your FinPulse AI Password</h2>
          <p>We received a request to reset your password. Please use the following 6-digit verification code to complete the reset:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP send timed out')), SMTP_SEND_TIMEOUT_MS)
      ),
    ]);
    console.log(`✉️ Reset password email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send reset password email to ${email}:`, error);
  }
}

function queueResetPasswordEmail(email: string, code: string) {
  void sendResetPasswordEmail(email, code);
}


// 1. Google Login Check
router.post('/google-login', async (req: any, res: any) => {
  try {
    const { email, name, avatar, providerId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          provider: 'GOOGLE',
          providerId,
          role: 'USER',
          status: 'ACTIVE',
          profile: {
            create: {
              avatar,
              bio: '',
            }
          }
        },
      });
    }

    res.json({
      hasPin: !!user.devicePin,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Error in google-login:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Set 6-Digit PIN
router.post('/set-pin', async (req: any, res: any) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin || pin.length !== 6) {
      return res.status(400).json({ error: 'Email and a 6-digit PIN are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    const user = await prisma.user.update({
      where: { email },
      data: {
        devicePin: hashedPin,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in set-pin:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Verify 6-Digit PIN
router.post('/verify-pin', async (req: any, res: any) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and PIN are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.devicePin) {
      return res.status(400).json({ error: 'User or PIN not set up' });
    }

    const isMatch = await bcrypt.compare(pin, user.devicePin);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect PIN' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in verify-pin:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Traditional Email & Password Signup (Register - Sends OTP)
router.post('/register', async (req: any, res: any) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in.' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert OTP in Prisma
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });

    // Respond immediately; email delivery runs in the background
    queueOtpEmail(email, code);

    res.json({
      requiresVerification: true,
      message: 'Verification code sent successfully.',
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Verify OTP and Create User
router.post('/verify-otp', async (req: any, res: any) => {
  try {
    const { email, name, password, code } = req.body;
    if (!email || !password || !code) {
      return res.status(400).json({ error: 'Email, password, and verification code are required' });
    }

    // 1. Verify OTP
    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    // Check one more time if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in.' });
    }

    // 2. Hash password and create user in PostgreSQL
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash: hashedPassword,
        provider: 'LOCAL',
        role: 'USER',
        status: 'ACTIVE',
        profile: {
          create: {
            avatar: null,
            bio: '',
          }
        }
      },
    });

    // 3. Delete the OTP verification record
    await prisma.otpVerification.delete({
      where: { email },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 6. Traditional Email & Password Sign-in (Login - Sends OTP)
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in Neon PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'This account was registered using Google. Please log in using Google.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    // Generate random 6-digit code for MFA
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert OTP in Prisma
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });

    // Respond immediately; email delivery runs in the background
    queueOtpEmail(email, code);

    res.json({
      requiresVerification: true,
      message: 'MFA verification code sent successfully.',
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 6.5 Verify Login OTP
router.post('/login-verify-otp', async (req: any, res: any) => {
  try {
    const { email, password, code } = req.body;
    if (!email || !password || !code) {
      return res.status(400).json({ error: 'Email, password, and verification code are required' });
    }

    // 1. Verify user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'User not found or invalid account type.' });
    }

    // Validate password again to ensure security
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // 2. Verify OTP
    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please log in again.' });
    }

    // 3. Delete OTP record
    await prisma.otpVerification.delete({
      where: { email },
    });

    res.json({
      hasPin: !!user.devicePin,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Error in login-verify-otp:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 7. Forgot PIN - Sends OTP to email
router.post('/forgot-pin', async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });

    // Respond immediately; email delivery runs in the background
    queueOtpEmail(email, code);

    res.json({ message: 'Verification code sent to your email.' });
  } catch (error: any) {
    console.error('Error in forgot-pin:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 8. Reset PIN with OTP Verification
router.post('/reset-pin-with-otp', async (req: any, res: any) => {
  try {
    const { email, code, newPin } = req.body;
    if (!email || !code || !newPin || newPin.length !== 6) {
      return res.status(400).json({ error: 'Email, verification code, and a new 6-digit PIN are required' });
    }

    // 1. Verify OTP
    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please try again.' });
    }

    // 2. Hash new PIN and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    const user = await prisma.user.update({
      where: { email },
      data: {
        devicePin: hashedPin,
      },
    });

    // 3. Delete OTP record
    await prisma.otpVerification.delete({
      where: { email },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in reset-pin-with-otp:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 8.5 Forgot Password - Sends OTP to email
router.post('/forgot-password', async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'This account was registered using Google. Please log in using Google.' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });

    // Send OTP email
    queueResetPasswordEmail(email, code);

    res.json({ message: 'Verification code sent to your email.' });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 8.6 Reset Password with OTP Verification
router.post('/reset-password', async (req: any, res: any) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    // 1. Verify OTP
    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please try again.' });
    }

    // 2. Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // 3. Delete OTP record
    await prisma.otpVerification.delete({
      where: { email },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 9. Update Profile Details (During signup or edit)
router.post('/update-profile', async (req: any, res: any) => {
  try {
    const { userId, name, bio, country, currency } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and Display Name are required' });
    }

    // 1. Update name, country, and currency on User table
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        country: country || undefined,
        currency: currency || undefined,
      },
    });

    // 2. Upsert profile record
    await prisma.profile.upsert({
      where: { userId },
      update: { bio },
      create: { userId, bio },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in update-profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 10. Fetch Profile Dashboard Statistics
router.get('/profile-stats/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count actual records
    const watchlistCount = await prisma.watchlistItem.count({
      where: {
        watchlist: { userId }
      }
    });

    const alertsCount = await prisma.alert.count({
      where: { userId, status: 'ACTIVE' }
    });

    const holdingsCount = await prisma.holding.count({
      where: { userId }
    });

    const holdings = await prisma.holding.findMany({
      where: { userId }
    });

    let totalPortfolioValue = 0;
    let totalCostBasis = 0;
    let todayProfitLoss = 0;

    let usdToInrRate = 83.45;
    try {
      const rateQuote: any = await yahooFinance.quote('USDINR=X');
      if (rateQuote && rateQuote.regularMarketPrice) {
        usdToInrRate = rateQuote.regularMarketPrice;
      }
    } catch (err) {
      console.error("Failed to fetch USDINR rate on backend stats:", err);
    }

    for (const h of holdings) {
      let currentPrice = h.avgCost;
      let dayChange = 0;
      try {
        const quote: any = await yahooFinance.quote(h.ticker);
        currentPrice = quote.regularMarketPrice ?? h.avgCost;
        dayChange = (quote.regularMarketChange ?? 0) * h.shares;
      } catch (err) {
        console.error(`Failed to fetch Yahoo quote for ${h.ticker}:`, err);
      }
      
      let val = h.shares * currentPrice;
      let cost = h.shares * h.avgCost;
      let change = dayChange;
      
      if (h.marketId === 'domestic' || h.ticker.toUpperCase().endsWith('.NS') || h.ticker.toUpperCase().endsWith('.BO')) {
        val = val / usdToInrRate;
        cost = cost / usdToInrRate;
        change = change / usdToInrRate;
      }
      
      totalPortfolioValue += val;
      totalCostBasis += cost;
      todayProfitLoss += change;
    }

    const userCurrency = user.currency || 'INR (₹)';
    const isINR = userCurrency.includes('₹') || userCurrency.toUpperCase().includes('INR');

    if (isINR) {
      totalPortfolioValue = totalPortfolioValue * usdToInrRate;
      totalCostBasis = totalCostBasis * usdToInrRate;
      todayProfitLoss = todayProfitLoss * usdToInrRate;
    }

    const totalReturn = totalPortfolioValue - totalCostBasis;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;
    const todayProfitLossPercent = totalCostBasis > 0 ? (todayProfitLoss / totalCostBasis) * 100 : 0;

    res.json({
      memberSince: user.createdAt,
      country: user.country || 'India',
      currency: user.currency || 'INR (₹)',
      market: user.timezone || 'NSE / BSE',
      plan: user.role === 'ADMIN' ? 'Admin Tier' : 'Premium Plus',
      watchlistCount,
      alertsCount,
      holdingsCount,
      portfolioValue: totalPortfolioValue,
      todayProfitLoss,
      todayProfitLossPercent,
      totalReturn,
      totalReturnPercent,
      preferences: user.preferences ? JSON.parse(user.preferences) : null,
      notificationSettings: user.notificationSettings ? JSON.parse(user.notificationSettings) : null,
    });
  } catch (error: any) {
    console.error('Error in profile-stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 11. Save User Preferences and Notifications
router.post('/save-preferences', async (req: any, res: any) => {
  try {
    const { userId, preferences, notificationSettings } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const dataToUpdate: any = {};
    if (preferences !== undefined) {
      dataToUpdate.preferences = preferences ? JSON.stringify(preferences) : null;
    }
    if (notificationSettings !== undefined) {
      dataToUpdate.notificationSettings = notificationSettings ? JSON.stringify(notificationSettings) : null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in save-preferences:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
