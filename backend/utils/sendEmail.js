const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"MedChain Platform" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw - email failure shouldn't break API
  }
};

const templates = {
  welcomeEmail: (name) => ({
    subject: 'Welcome to MedChain B2B Platform',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a101f; color: #e8f0fe; padding: 40px; border-radius: 16px;">
        <h1 style="color: #1e9daa; font-size: 28px; margin-bottom: 8px;">MedChain</h1>
        <p style="color: #8fa3c0; font-size: 13px; margin-bottom: 32px;">B2B Pharmaceutical Platform</p>
        <h2 style="color: #ffffff; font-size: 20px;">Welcome, ${name}!</h2>
        <p style="color: #8fa3c0; line-height: 1.6;">Thank you for registering on MedChain. Your account is currently under review by our admin team.</p>
        <p style="color: #8fa3c0; line-height: 1.6;">You will receive another email once your account has been approved and activated.</p>
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); color: #566880; font-size: 12px;">
          MedChain B2B Platform · Connecting the Pharma Supply Chain
        </div>
      </div>
    `,
  }),

  approvalEmail: (name, approved) => ({
    subject: approved ? '✅ Account Approved — MedChain' : '❌ Account Not Approved — MedChain',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a101f; color: #e8f0fe; padding: 40px; border-radius: 16px;">
        <h1 style="color: #1e9daa;">MedChain</h1>
        <h2 style="color: #ffffff;">Hello ${name},</h2>
        ${approved
          ? `<p style="color: #22c55e; font-size: 16px;">🎉 Your account has been approved!</p>
             <p style="color: #8fa3c0;">You can now log in and access the full MedChain platform.</p>
             <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #1e9daa; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Sign In Now</a>`
          : `<p style="color: #ef4444;">Your account registration was not approved at this time.</p>
             <p style="color: #8fa3c0;">Please contact support for more information.</p>`
        }
      </div>
    `,
  }),

  newOrderEmail: (sellerName, orderNumber, buyerCompany, amount) => ({
    subject: `📦 New Order Received — ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a101f; color: #e8f0fe; padding: 40px; border-radius: 16px;">
        <h1 style="color: #1e9daa;">MedChain</h1>
        <h2>Hello ${sellerName},</h2>
        <p style="color: #8fa3c0;">You have received a new order from <strong style="color: #e8f0fe">${buyerCompany}</strong>.</p>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p>Order #: <strong>${orderNumber}</strong></p>
          <p>Amount: <strong style="color: #1e9daa">₹${Number(amount).toLocaleString('en-IN')}</strong></p>
        </div>
        <a href="${process.env.CLIENT_URL}/orders" style="display: inline-block; background: #1e9daa; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View Order</a>
      </div>
    `,
  }),
};

module.exports = { sendEmail, templates };
