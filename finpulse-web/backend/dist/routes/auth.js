import { Router } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
const router = Router();
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
async function sendOtpEmail(email, code) {
    console.log(`✉️ [sendOtpEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES" : "NO"}`);
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
        }
        catch (error) {
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
        }
        catch (error) {
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
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP send timed out')), SMTP_SEND_TIMEOUT_MS)),
        ]);
        console.log(`✉️ OTP email sent to ${email}`);
    }
    catch (error) {
        console.error(`Failed to send OTP email to ${email}:`, error);
    }
}
function queueOtpEmail(email, code) {
    void sendOtpEmail(email, code);
}
async function sendResetPasswordEmail(email, code) {
    console.log(`✉️ [sendResetPasswordEmail] Initiated. BREVO_API_KEY detected: ${process.env.BREVO_API_KEY ? "YES" : "NO"}`);
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
        }
        catch (error) {
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
        }
        catch (error) {
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
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP send timed out')), SMTP_SEND_TIMEOUT_MS)),
        ]);
        console.log(`✉️ Reset password email sent to ${email}`);
    }
    catch (error) {
        console.error(`Failed to send reset password email to ${email}:`, error);
    }
}
function queueResetPasswordEmail(email, code) {
    void sendResetPasswordEmail(email, code);
}
// 1. Google Login Check
router.post('/google-login', async (req, res) => {
    try {
        let { email, name, avatar, providerId, token } = req.body;
        if (token) {
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json();
                    email = userInfo.email;
                    name = userInfo.name;
                    avatar = userInfo.picture;
                    providerId = userInfo.sub;
                }
            }
            catch (err) {
                console.error('Failed to verify Google OAuth token on backend:', err.message);
            }
        }
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
        else {
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
                }
                else {
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
        const jwtToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
            email: user.email,
        });
    }
    catch (error) {
        console.error('Error in google-login:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 2. Set 6-Digit PIN
router.post('/set-pin', async (req, res) => {
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
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Error in set-pin:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 3. Verify 6-Digit PIN
router.post('/verify-pin', async (req, res) => {
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
        }
        else {
            const hash = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');
            isMatch = (hash === user.devicePin);
        }
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect PIN' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Error in verify-pin:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 4. Traditional Email & Password Signup (Register)
router.post('/register', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 5. Verify OTP and Create User
router.post('/verify-otp', async (req, res) => {
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
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Error in verify-otp:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 6. Traditional Email & Password Sign-in
router.post('/login', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 6.5 Verify Login OTP
router.post('/login-verify-otp', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in login-verify-otp:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 7. Forgot PIN
router.post('/forgot-pin', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in forgot-pin:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 8. Reset PIN with OTP Verification
router.post('/reset-pin-with-otp', async (req, res) => {
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
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Error in reset-pin-with-otp:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 9. Forgot Password
router.post('/forgot-password', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 10. Reset Password
router.post('/reset-password', async (req, res) => {
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
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// 11. Update Profile (during signup setup)
router.post('/update-profile', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in update-profile:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
export default router;
