import { Router } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { authLimiter } from '../utils/security.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'finpulse-secret-key-123456';

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
  console.log(`[sendOtpEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES" : "NO"}`);
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`Attempting to send OTP email to ${email} via Brevo API...`);
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

      console.log(`OTP email sent to ${email} successfully via Brevo API`);
      return;
    } catch (error) {
      console.error(`Failed to send OTP email via Brevo API to ${email}:`, error);
      console.log('Falling back to other configurations...');
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`Attempting to send OTP email to ${email} via Resend API...`);
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

      console.log(`OTP email sent to ${email} successfully via Resend API`);
      return;
    } catch (error) {
      console.error(`Failed to send OTP email via Resend API to ${email}:`, error);
      console.log('Falling back to SMTP configuration...');
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n==========================================`);
    console.log(`[OTP Fallback] Verification code for ${email}: ${code}`);
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
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
  }
}

function queueOtpEmail(email: string, code: string) {
  void sendOtpEmail(email, code);
}

async function sendResetPasswordEmail(email: string, code: string) {
  console.log(`[sendResetPasswordEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES" : "NO"}`);
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`Attempting to send reset password email to ${email} via Brevo API...`);
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

      console.log(`Reset password email sent to ${email} successfully via Brevo API`);
      return;
    } catch (error) {
      console.error(`Failed to send reset password email via Brevo API to ${email}:`, error);
      console.log('Falling back to other configurations...');
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`Attempting to send reset password email to ${email} via Resend API...`);
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

      console.log(`Reset password email sent to ${email} successfully via Resend API`);
      return;
    } catch (error) {
      console.error(`Failed to send reset password email via Resend API to ${email}:`, error);
      console.log('Falling back to SMTP configuration...');
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n==========================================`);
    console.log(`[Reset Password Fallback] Verification code for ${email}: ${code}`);
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
    console.log(`Reset password email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send reset password email to ${email}:`, error);
  }
}

function queueResetPasswordEmail(email: string, code: string) {
  void sendResetPasswordEmail(email, code);
}

async function sendNewsletterWelcomeEmail(email: string) {
  const subject = 'Welcome to the FinPulse AI Market Brief';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
      <div style="margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #0284c7; margin: 0 0 8px 0;">FinPulse<span style="color: #0369a1;">.ai</span></h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Institutional Market Brief & Computational Sentiment</p>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">You're on the list!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">Thank you for subscribing to the FinPulse AI daily market brief. Each morning before the opening bell, you will receive our quantitative breakdown of global indices, high-sentiment momentum picks, and computational market driver insights.</p>
      <div style="padding: 16px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0284c7; margin: 24px 0;">
        <p style="margin: 0; color: #0369a1; font-weight: 600; font-size: 13px;">Next intelligence brief scheduled: Tomorrow at 08:00 AM UTC</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">You received this email because ${email} was subscribed on finpulse.ai. If this was not you, you can ignore this notice.</p>
    </div>
  `;

  if (process.env.BREVO_API_KEY) {
    try {
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
          subject,
          htmlContent,
        }),
      });
      if (response.ok) {
        console.log(`Newsletter welcome email sent to ${email} via Brevo`);
        return;
      }
    } catch (error) {
      console.error('Brevo newsletter email dispatch failed:', error);
    }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"FinPulse AI" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`Newsletter welcome email sent to ${email} via SMTP`);
    } catch (err) {
      console.error('SMTP newsletter email dispatch failed:', err);
    }
  }
}

// POST /api/auth/subscribe (Newsletter & Market Brief)
router.post('/subscribe', authLimiter, async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // If an existing registered user matches, update their preferences
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (existingUser) {
        let currentSettings: any = {};
        if (existingUser.notificationSettings) {
          try {
            currentSettings = JSON.parse(existingUser.notificationSettings);
          } catch {
            currentSettings = {};
          }
        }
        currentSettings.newsletter = true;
        currentSettings.marketBrief = true;

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            notificationSettings: JSON.stringify(currentSettings)
          }
        });
      }
    } catch (dbErr) {
      console.warn('Notice: User preference sync skipped:', dbErr);
    }

    // Send confirmation email asynchronously
    void sendNewsletterWelcomeEmail(cleanEmail);

    return res.status(200).json({
      success: true,
      message: 'Subscribed to FinPulse Market Brief successfully!',
      email: cleanEmail
    });
  } catch (error: any) {
    console.error('Error handling newsletter subscription:', error);
    return res.status(500).json({ error: error.message || 'Failed to process subscription' });
  }
});

// 1. Google Login Check
router.post('/google-login', authLimiter, async (req: any, res: any) => {
  try {
    let { email, name, avatar, providerId, token } = req.body;

    if (token) {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userInfoResponse.ok) {
          const userInfo: any = await userInfoResponse.json();
          email = userInfo.email;
          name = userInfo.name;
          avatar = userInfo.picture;
          providerId = userInfo.sub;
        }
      } catch (err: any) {
        console.error('Failed to verify Google OAuth token on backend:', err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    const isNewUser = !user;
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
    } else {
      if (avatar && user.avatar !== avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar },
        });

        const userProfile = await prisma.profile.findUnique({
          where: { userId: user.id }
        });
        if (userProfile) {
          await prisma.profile.update({
            where: { userId: user.id },
            data: { avatar }
          });
        } else {
          await prisma.profile.create({
            data: {
              userId: user.id,
              avatar,
              bio: ''
            }
          });
        }
      }
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      hasPin: !!user.devicePin,
      isNewUser,
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

    const hashedPin = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');

    const user = await prisma.user.update({
      where: { email },
      data: {
        devicePin: hashedPin,
      },
    });

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

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // If user has no PIN set, tell the frontend to navigate to set-pin flow
    if (!user.devicePin) {
      return res.status(200).json({ needsPinSetup: true, email: user.email });
    }

    let isMatch = false;
    if (user.devicePin.startsWith('$2a$') || user.devicePin.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(pin, user.devicePin);
      if (isMatch) {
        const newFastHash = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');
        prisma.user.update({
          where: { email },
          data: { devicePin: newFastHash }
        }).catch(err => console.error("Error migrating PIN hash:", err));
      }
    } else {
      const hash = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');
      isMatch = (hash === user.devicePin);
      
      if (!isMatch) {
        // Fallback check for PINs hashed with the old fallback key
        const oldHash = crypto.createHmac('sha256', 'fallback_secret').update(pin).digest('hex');
        if (oldHash === user.devicePin) {
          isMatch = true;
          // Automatically upgrade/migrate PIN hash to the new key
          const newHash = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');
          prisma.user.update({
            where: { id: user.id },
            data: { devicePin: newHash }
          }).catch(err => console.error("Error migrating PIN hash from old secret:", err));
        }
      }
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect PIN' });
    }

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

// 4. Traditional Email & Password Signup (Register)
router.post('/register', authLimiter, async (req: any, res: any) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered. Please sign in.' });
    }

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

    await prisma.otpVerification.delete({
      where: { email },
    });

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
      isNewUser: true,
    });
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 6. Traditional Email & Password Sign-in
router.post('/login', authLimiter, async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'This account was registered using Google. Please log in using Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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
router.post('/login-verify-otp', authLimiter, async (req: any, res: any) => {
  try {
    const { email, password, code } = req.body;
    if (!email || !password || !code) {
      return res.status(400).json({ error: 'Email, password, and verification code are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'User not found or invalid account type.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please log in again.' });
    }

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

// 7. Forgot PIN
router.post('/forgot-pin', async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please try again.' });
    }

    const hashedPin = crypto.createHmac('sha256', JWT_SECRET).update(newPin).digest('hex');

    const user = await prisma.user.update({
      where: { email },
      data: {
        devicePin: hashedPin,
      },
    });

    await prisma.otpVerification.delete({
      where: { email },
    });

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

// 9. Forgot Password
router.post('/forgot-password', async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

    queueResetPasswordEmail(email, code);

    res.json({ message: 'Password reset code sent to your email.' });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 10. Reset Password
router.post('/reset-password', async (req: any, res: any) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and a new password are required' });
    }

    const verification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await prisma.otpVerification.delete({
      where: { email },
    });

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

// 11. Update Profile (during signup setup)
router.post('/update-profile', async (req: any, res: any) => {
  try {
    const { userId, name, bio } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and Display Name are required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        profile: {
          upsert: {
            update: { bio },
            create: { bio }
          }
        }
      },
    });

    res.json({
      message: 'Profile updated successfully',
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

// GET /profile-stats/:userId
router.get('/profile-stats/:userId', async (req: any, res: any) => {
  try {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true }
    });
    const currency = String(user?.currency || 'INR').toUpperCase();
    const targetCurrency = currency.includes('USD') || currency.includes('$') ? 'USD'
      : currency.includes('EUR') || currency.includes('€') ? 'EUR'
        : currency.includes('GBP') || currency.includes('£') ? 'GBP'
          : 'INR';

    const holdings = await prisma.holding.findMany({
      where: { userId }
    });

    const alertsCount = await prisma.alert.count({
      where: { userId, enabled: true }
    });

    const holdingsCount = holdings.length;

    if (holdings.length === 0) {
      return res.json({
        portfolioValue: 0.00,
        todayProfitLoss: 0.00,
        todayProfitLossPercent: 0.00,
        totalReturn: 0.00,
        totalReturnPercent: 0.00,
        alertsCount,
        holdingsCount: 0
      });
    }

    const symbols = holdings.map(h => h.ticker.toUpperCase());
    const quotes: Record<string, { price: number; changePercent: number }> = {};
    const fxSymbols = ['USDINR=X', 'USDEUR=X', 'USDGBP=X'];
    
    try {
      const yahooFinance = new (await import('yahoo-finance2')).default();
      const results = await yahooFinance.quote([...symbols, ...fxSymbols]);
      const quotesArray = Array.isArray(results) ? results : [results];
      for (const q of quotesArray) {
        if (q.symbol) {
          quotes[q.symbol.toUpperCase()] = {
            price: q.regularMarketPrice ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0
          };
        }
      }
    } catch (err) {
      console.warn("Error fetching quotes in profile stats:", err);
    }

    const usdToInr = quotes['USDINR=X']?.price || 83.45;
    const usdToEur = quotes['USDEUR=X']?.price || 0.92;
    const usdToGbp = quotes['USDGBP=X']?.price || 0.79;
    const targetPerUsd = targetCurrency === 'INR' ? usdToInr : targetCurrency === 'EUR' ? usdToEur : targetCurrency === 'GBP' ? usdToGbp : 1;
    const toTargetCurrency = (value: number, marketId: string) => {
      const usdValue = marketId === 'domestic' ? value / usdToInr : value;
      return usdValue * targetPerUsd;
    };

    let portfolioValue = 0;
    let totalCost = 0;
    let totalReturn = 0;
    let todayProfitLoss = 0;

    for (const h of holdings) {
      const symbolUpper = h.ticker.toUpperCase();
      const quote = quotes[symbolUpper];
      const currentPrice = quote && quote.price > 0 ? quote.price : h.avgCost;
      const changePercent = quote ? quote.changePercent : 0;

      const marketValue = toTargetCurrency(h.shares * currentPrice, h.marketId);
      const cost = toTargetCurrency(h.shares * h.avgCost, h.marketId);
      const profitLoss = marketValue - cost;
      const dailyGain = marketValue * (changePercent / 100);

      portfolioValue += marketValue;
      totalCost += cost;
      totalReturn += profitLoss;
      todayProfitLoss += dailyGain;
    }

    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const previousDayValue = portfolioValue - todayProfitLoss;
    const todayProfitLossPercent = previousDayValue > 0 ? (todayProfitLoss / previousDayValue) * 100 : 0;

    res.json({
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      todayProfitLoss: Math.round(todayProfitLoss * 100) / 100,
      todayProfitLossPercent: Math.round(todayProfitLossPercent * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      alertsCount,
      holdingsCount
    });
  } catch (error: any) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
