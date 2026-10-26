import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.MAIL_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.MAIL_PORT || 465);
const SMTP_USER = process.env.MAIL_USER;
const SMTP_PASS = process.env.MAIL_PASS;
const SMTP_SECURE = process.env.MAIL_SECURE ? process.env.MAIL_SECURE === 'true' : SMTP_PORT === 465;
const SMTP_FROM = process.env.MAIL_FROM || SMTP_USER;
const SMTP_FROM_NAME = process.env.MAIL_FROM_NAME || 'Smart Courier Management System';
const isProduction = process.env.NODE_ENV === 'production';
// Brevo's HTTPS API, for hosts that block outbound SMTP ports (e.g. Render's free plan).
// When set it takes precedence over SMTP; MAIL_FROM must be a sender verified in Brevo.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const isSmtpConfigured = Boolean(SMTP_USER && SMTP_PASS);

export const isMailConfigured = Boolean(BREVO_API_KEY || isSmtpConfigured);

export const transporter = isSmtpConfigured && !BREVO_API_KEY
	? nodemailer.createTransport({
		host: SMTP_HOST,
		port: SMTP_PORT,
		secure: SMTP_SECURE,
		auth: { user: SMTP_USER, pass: SMTP_PASS }
	})
	: null;

// Public URL of the frontend, used to build links inside emails
export function appUrl() {
	const configured = process.env.APP_URL || (process.env.CLIENT_ORIGIN || '').split(',')[0];
	return (configured || 'http://localhost:5173').trim().replace(/\/+$/, '');
}

export function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export class MailNotConfiguredError extends Error {}

function layout(title, bodyHtml) {
	return `
    <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:520px; margin:auto; color:#0f172a;">
      <h2 style="color:#4338ca;">${escapeHtml(title)}</h2>
      ${bodyHtml}
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
      <p style="color:#64748b; font-size:12px;">This is an automated message from ${escapeHtml(SMTP_FROM_NAME)}. If you did not expect it, you can ignore it.</p>
    </div>
  `;
}

async function send({ to, subject, text, html, devNote }) {
	if (!isMailConfigured) {
		if (isProduction) throw new MailNotConfiguredError('Email service is not configured');
		// Local development without SMTP: print what would have been sent
		console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n[mail:dev] ${devNote || text}\n`);
		return;
	}
	if (BREVO_API_KEY) {
		const res = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				sender: { name: SMTP_FROM_NAME, email: SMTP_FROM },
				to: [{ email: to }],
				subject,
				textContent: text,
				htmlContent: html
			}),
			signal: AbortSignal.timeout(15000)
		});
		if (!res.ok) throw new Error(`Brevo API error ${res.status}: ${await res.text()}`);
		return;
	}
	await transporter.sendMail({ from: `${SMTP_FROM_NAME} <${SMTP_FROM}>`, to, subject, text, html });
}

export async function sendStatusEmail({ to, parcel, newStatus }) {
	if (!to || !isMailConfigured) return;
	const subject = `Your parcel ${parcel.trackingCode} is now ${newStatus}`;
	const html = layout('Parcel Status Updated', `
      <p>Hello${parcel?.customer?.name ? ` ${escapeHtml(parcel.customer.name)}` : ''},</p>
      <p>Your parcel with tracking code <strong>${escapeHtml(parcel.trackingCode)}</strong> is now <strong>${escapeHtml(newStatus)}</strong>.</p>
      <ul>
        <li>Pickup: ${escapeHtml(parcel.pickupAddress)}</li>
        <li>Delivery: ${escapeHtml(parcel.deliveryAddress)}</li>
      </ul>
      <p><a href="${appUrl()}/track-parcel?code=${encodeURIComponent(parcel.trackingCode)}">Track your parcel</a></p>
    `);
	await send({ to, subject, text: `Parcel ${parcel.trackingCode} status changed to ${newStatus}`, html });
}

export async function sendVerificationCodeEmail({ to, name, code, minutes }) {
	const html = layout('Verify your email', `
      <p>Hello ${escapeHtml(name)},</p>
      <p>Use this code to verify your email address:</p>
      <p style="font-size:32px; font-weight:bold; letter-spacing:8px; margin:16px 0;">${escapeHtml(code)}</p>
      <p>The code expires in ${minutes} minutes. Never share it with anyone.</p>
    `);
	await send({
		to,
		subject: `${code} is your verification code`,
		text: `Your verification code is ${code}. It expires in ${minutes} minutes.`,
		html,
		devNote: `Verification code: ${code}`
	});
}

export async function sendPasswordResetEmail({ to, name, link, minutes }) {
	const html = layout('Reset your password', `
      <p>Hello ${escapeHtml(name)},</p>
      <p>We received a request to reset your password. This link expires in ${minutes} minutes and can be used once.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">Reset password</a></p>
      <p>If you did not request this, you can ignore this email; your password will not change.</p>
    `);
	await send({ to, subject: 'Reset your password', text: `Reset your password: ${link}`, html, devNote: `Reset link: ${link}` });
}

export async function sendAgentInviteEmail({ to, name, link, hours }) {
	const html = layout('You have been added as a delivery agent', `
      <p>Hello ${escapeHtml(name)},</p>
      <p>An administrator created a delivery agent account for you. Set your password to activate it. The link expires in ${hours} hours.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block; background:#4f46e5; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">Set my password</a></p>
    `);
	await send({ to, subject: 'Activate your delivery agent account', text: `Set your password: ${link}`, html, devNote: `Invite link: ${link}` });
}
