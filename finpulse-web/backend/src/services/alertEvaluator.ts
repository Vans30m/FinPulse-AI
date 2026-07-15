import { AlertStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { yahooFinance } from '../yahooFinance.js';
import nodemailer from 'nodemailer';
import axios from 'axios';

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

async function fetchPricesBatch(tickers: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  if (tickers.length === 0) return prices;

  const uniqueTickers = Array.from(new Set(tickers));

  try {
    // Yahoo Finance spark endpoint does not require crumb and accepts batching
    const url = 'https://query2.finance.yahoo.com/v8/finance/spark';
    const response = await axios.get(url, {
      params: {
        symbols: uniqueTickers.join(','),
        range: '1d',
        interval: '1d'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const data = response.data || {};
    for (const symbol of uniqueTickers) {
      const spark = data[symbol];
      if (spark && Array.isArray(spark.close) && spark.close.length > 0) {
        const lastPrice = spark.close[spark.close.length - 1];
        if (typeof lastPrice === 'number') {
          prices[symbol] = lastPrice;
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Alert Evaluator] Spark batch fetch failed: ${err.message}. Falling back to individual chart requests.`);
    
    // Fallback: fetch individually using yahooFinance.chart (which does not require crumb)
    for (const symbol of uniqueTickers) {
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        const chartResult = await yahooFinance.chart(symbol, {
          period1: start,
          period2: now,
          interval: '1d'
        });
        const lastQuote = chartResult?.quotes?.[chartResult.quotes.length - 1];
        const lastPrice = lastQuote?.close || lastQuote?.adjclose;
        if (typeof lastPrice === 'number') {
          prices[symbol] = lastPrice;
        }
      } catch (fallbackErr: any) {
        console.error(`[Alert Evaluator] Fallback chart fetch failed for ${symbol}:`, fallbackErr.message);
      }
    }
  }
  return prices;
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

    const alertTickers = activeAlerts.map(a => a.ticker);
    const prices = await fetchPricesBatch(alertTickers);

    for (const alert of activeAlerts) {
      try {
        const currentPrice = prices[alert.ticker];

        if (currentPrice === undefined || currentPrice === null) {
          console.warn(`Could not fetch price for ${alert.ticker}`);
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
