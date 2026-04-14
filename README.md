# Moodmelt — Frontend Only

## Setup Steps

### Step 1 — Google Apps Script (do this first)
1. Go to Google Sheets → Create new sheet → Name it "Moodmelt Analytics"
2. Click Extensions → Apps Script
3. Delete all existing code
4. Paste the entire content of GOOGLE_APPS_SCRIPT.js
5. Click Save
6. Click Deploy → New Deployment → Web App
7. Set "Who has access" to Anyone
8. Click Deploy → Copy the Web App URL
9. Open public/js/app.jsx → Find: PASTE_YOUR_WEBHOOK_URL_HERE → Replace with your URL

### Step 2 — Deploy to Netlify/Vercel
Upload the entire "public" folder to Netlify or Vercel.
Both netlify.toml and vercel.json are included for routing.

### Step 3 — Connect your domain
Follow Netlify/Vercel docs to connect your custom domain.

## EmailJS Already Connected
Service ID:  service_g9f0jef
Template ID: template_tm3thr8
Receives at: moodmeltteam@gmail.com

## Discount Codes
- 1A2S3D = 10% off
- 2A3S4D = 20% off
