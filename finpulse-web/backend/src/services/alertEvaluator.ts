import { AlertStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { yahooFinance } from '../yahooFinance.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

async function sendAlertEmail(email: string, name: string, ticker: string, direction: string, targetPrice: number, currentPrice: number, notes?: string) {
  const subject = `🔔 FinPulse AI Alert Triggered: ${ticker}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ea4335;">Price Alert Triggered!</h2>
      <p>Hello ${name || 'Trader'},</p>
      <p>Your price alert for <strong>${ticker}</strong> has met its target condition.</p>
      <div style="padding: 15px; background-color: #fef2f2; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2; color: #991b1b;">
        <p style="margin: 4px 0;"><strong>Ticker:</strong> ${ticker}</p>
        <p style="margin: 4px 0;"><strong>Condition:</strong> Price went ${direction.toLowerCase()} target of $${targetPrice.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Trigger Price:</strong> $${currentPrice.toFixed(2)}</p>
        ${notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
      <p>Stay updated with FinPulse AI.</p>
      <p style="font-size: 11px; color: #888; margin-top: 30px;">This is an automated notification. To manage your alerts, please visit your dashboard.</p>
    </div>
  `;

  if (process.env.BREVO_API_KEY) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
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
      console.log(`✉️ Alert trigger email sent to ${email} via Brevo`);
      return;
    } catch (error) {
      console.error(`Failed to send alert email via Brevo:`, error);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FinPulse AI <onboarding@resend.dev>',
          to: email,
          subject,
          html: htmlContent,
        }),
      });
      console.log(`✉️ Alert trigger email sent to ${email} via Resend`);
      return;
    } catch (error) {
      console.error(`Failed to send alert email via Resend:`, error);
    }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"FinPulse AI Alerts" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`✉️ Alert trigger email sent to ${email} via SMTP`);
    } catch (error) {
      console.error(`Failed to send alert email via SMTP:`, error);
    }
  } else {
    console.log(`✉️ [Alert Fallback] Trigger email simulated for ${email}: ${ticker} crossed ${direction} ${targetPrice}`);
  }
}

export async function evaluateAlerts() {
  console.log('⏰ Starting background price alert evaluation...');
  try {
    const activeAlerts = await prisma.alert.findMany({
      where: {
        status: AlertStatus.ACTIVE,
        enabled: true,
      },
      include: {
        user: true,
      },
    });

    if (activeAlerts.length === 0) {
      console.log('ℹ️ No active alerts to evaluate.');
      return;
    }

    console.log(`Evaluating ${activeAlerts.length} active alerts...`);

    for (const alert of activeAlerts) {
      try {
        const quote = await yahooFinance.quote(alert.ticker);
        const currentPrice = quote.regularMarketPrice;

        if (!currentPrice) {
          console.warn(`Could not fetch quote for ${alert.ticker}`);
          continue;
        }

        let isTriggered = false;
        if (alert.direction === 'ABOVE' && currentPrice >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.direction === 'BELOW' && currentPrice <= alert.targetPrice) {
          isTriggered = true;
        }

        if (isTriggered) {
          console.log(`🔔 Alert Triggered! User: ${alert.user.email}, Ticker: ${alert.ticker}, Current: ${currentPrice}, Target: ${alert.targetPrice}`);

          // Update alert
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              isTriggered: true,
              triggeredAt: new Date(),
              enabled: alert.repeat,
              status: alert.repeat ? AlertStatus.ACTIVE : AlertStatus.TRIGGERED,
              currentValue: currentPrice,
            },
          });

          // Create alert history
          await prisma.alertHistory.create({
            data: {
              alertId: alert.id,
              triggeredPrice: currentPrice,
              triggeredAt: new Date(),
            },
          });

          // Send email notification
          if (alert.user && alert.user.email) {
            await sendAlertEmail(
              alert.user.email,
              alert.user.name || alert.user.email.split('@')[0],
              alert.ticker,
              alert.direction,
              alert.targetPrice,
              currentPrice,
              alert.notes || undefined
            );
          }
        }
      } catch (err: any) {
        console.error(`Error evaluating alert ${alert.id} for ${alert.ticker}:`, err.message);
      }
    }
  } catch (error: any) {
    console.error('Error in evaluateAlerts:', error.message);
  }
}
