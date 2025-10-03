export const template  = (code:number , name:string  , subject:string , message:string):string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f2f4f8;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
      text-align: center;
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
      font-size: 16px;
      line-height: 1.5;
    }
    .code {
      display: inline-block;
      background-color: #e6f0ff;
      color: #004085;
      padding: 15px 25px;
      font-size: 24px;
      letter-spacing: 4px;
      margin-top: 20px;
      border-radius: 8px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #aaaaaa;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <h2>Hi ${name},</h2>
    <p>${message}:</p>
    <div class="code">${code}</div>
    <p>This code will expire shortly. If you didn’t request this, feel free to ignore this email.</p>
    <div class="footer">
      &copy;  Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>`;

