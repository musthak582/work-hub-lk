# WorkHub LK — Deployment Guide

## Pre-deployment checklist

### 1. Supabase Setup
- [ ] Run `001_schema.sql` in SQL Editor
- [ ] Run `002_rls.sql` in SQL Editor
- [ ] Run `003_storage.sql` in SQL Editor
- [ ] Run `004_functions.sql` in SQL Editor
- [ ] Enable Realtime for `messages` and `chats` tables
      → Table Editor → select table → Realtime toggle ON
- [ ] Confirm RLS is enabled on all tables
- [ ] Copy Project URL + anon key + service role key

### 2. Twilio Setup
- [ ] Create account at twilio.com
- [ ] Go to Verify → Services → Create Service
      Name: "WorkHub LK", Channel: SMS
- [ ] Copy Account SID, Auth Token, Service SID
- [ ] Top up account (minimum $5 for ~100 OTPs)

### 3. Cloudinary Setup
- [ ] Create account at cloudinary.com
- [ ] Go to Settings → Upload → Upload Presets
- [ ] Create preset: `workhub_uploads` (unsigned mode)
- [ ] Copy Cloud Name, API Key, API Secret

### 4. PayHere Setup
- [ ] Sandbox: register at sandbox.payhere.lk
- [ ] Copy Merchant ID and Merchant Secret
- [ ] For live: apply at payhere.lk with business details
- [ ] Set notify URL: https://yourdomain.com/api/webhooks/payhere

### 5. Vercel Deployment
- [ ] Push code to GitHub
- [ ] Import project in vercel.com
- [ ] Add ALL environment variables from .env.example
- [ ] Set NEXT_PUBLIC_APP_URL to your Vercel URL
- [ ] Set NEXT_PUBLIC_PAYHERE_MODE=sandbox (until live)
- [ ] Deploy

### 6. Post-deployment
- [ ] Test registration → OTP → role select
- [ ] Test worker payment (sandbox card: 4916217501611292)
- [ ] Test profile creation
- [ ] Test search + filters
- [ ] Test chat unlock payment
- [ ] Test real-time chat
- [ ] Test admin panel (login with ADMIN_EMAIL)
- [ ] Switch NEXT_PUBLIC_PAYHERE_MODE=live when ready

## PayHere sandbox test cards
- Visa:       4916217501611292
- MasterCard: 5307732125531191
- CVV: 100 | Expiry: any future date

## Environment variables for Vercel
All variables in .env.example must be added to
Vercel → Project → Settings → Environment Variables