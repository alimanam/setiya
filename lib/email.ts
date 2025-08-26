import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Create transporter based on environment variables
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  }

  return nodemailer.createTransport(config)
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>بازیابی رمز عبور</title>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Vazirmatn', 'Tahoma', sans-serif;
          line-height: 1.8;
          color: #2d3748;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          direction: rtl;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 500;
          color: #1a202c;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #4a5568;
          margin-bottom: 16px;
          line-height: 1.7;
        }
        .reset-button {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          margin: 30px 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
        }
        .warning-box {
          background: #fef5e7;
          border: 1px solid #f6ad55;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        }
        .warning-text {
          color: #c05621;
          font-size: 14px;
          font-weight: 500;
        }
        .footer {
          background: #f7fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 14px;
          color: #718096;
          margin-bottom: 8px;
        }
        .company-name {
          font-weight: 600;
          color: #4f46e5;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 20px 0;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 12px;
          }
          .header, .content, .footer {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .reset-button {
            padding: 14px 28px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 بازیابی رمز عبور</h1>
          <p>سیستم مدیریت گیمینگ هاوس</p>
        </div>
        
        <div class="content">
          <div class="greeting">سلام عزیز 👋</div>
          
          <p class="message">
            درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.
          </p>
          
          <p class="message">
            برای تنظیم رمز عبور جدید، روی لینک زیر کلیک کنید:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="reset-button">
              🔑 بازیابی رمز عبور
            </a>
          </div>
          
          <div class="divider"></div>
          
          <div class="warning-box">
            <p class="warning-text">
              ⏰ این لینک تا 1 ساعت معتبر است. لطفاً در اسرع وقت نسبت به تغییر رمز عبور اقدام کنید.
            </p>
          </div>
          
          <p class="message">
            اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید و رمز عبور شما تغییری نخواهد کرد.
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            این ایمیل به صورت خودکار از سیستم <span class="company-name">گیمینگ هاوس</span> ارسال شده است.
          </p>
          <p class="footer-text">
            لطفاً به این ایمیل پاسخ ندهید.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    بازیابی رمز عبور
    
    سلام،
    
    درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.
    
    برای تنظیم رمز عبور جدید، به لینک زیر مراجعه کنید:
    ${resetUrl}
    
    این لینک تا 1 ساعت معتبر است.
    
    اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
  `

  return sendEmail({
    to: email,
    subject: 'بازیابی رمز عبور - سیستم مدیریت',
    html,
    text
  })
}