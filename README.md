<<<<<<< HEAD
# Azibataram
=======
# Shopa Orders: self-hosted on GitHub Pages + Supabase

A no-build PWA. GitHub Pages hosts the static files; Supabase provides login, database and the two payment functions (GitHub Pages cannot run server code).

## 1. Supabase (free tier)
1. Create a project at supabase.com.
2. SQL Editor > paste `supabase/schema.sql` > Run.
3. Authentication > Providers > Email: turn OFF "Confirm email" while testing.
4. Project Settings > API: copy the URL and anon key into `config.js`.
5. Authentication > URL Configuration: set Site URL to your GitHub Pages address.

## 2. GitHub
1. Create a repo, push all these files to `main`.
2. Settings > Pages > Source: **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys on every push.
3. Your app: `https://USERNAME.github.io/REPO/`. Vendor order pages: `.../#/v/their-slug`.

## 3. Paystack payments (web only)
```
npm i -g supabase && supabase login && supabase link --project-ref YOUR-REF
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxx SITE_URL=https://USERNAME.github.io/REPO/
supabase functions deploy paystack-init
supabase functions deploy paystack-webhook --no-verify-jwt
```
Paystack dashboard > Settings > API & Webhooks > Webhook URL: `https://YOUR-REF.supabase.co/functions/v1/paystack-webhook`. Test with `sk_test` keys first, then switch to live.
Each payment adds 30 days to the vendor's plan.

## 4. Google Play
1. Use a custom domain or a `USERNAME.github.io` repo: `assetlinks.json` must be served at the domain **root** (`/.well-known/assetlinks.json`).
2. Go to pwabuilder.com, enter your URL, generate the Android package, and put its package name and SHA-256 fingerprint in `.well-known/assetlinks.json`.
3. Play Console ($25 once): upload the `.aab`, add `privacy.html` URL, complete Data Safety, content rating and the account-deletion question. New personal accounts need a 12-tester, 14-day closed test first.
4. Inside the Play app the upgrade buttons are hidden (payments stay on the web). Re-check Google's Payments policy for Nigeria before launch.

## 5. Extra income features (run `supabase/upgrade.sql` after `schema.sql`)
Deploy the extra functions: `supabase functions deploy paystack-collect paystack-subaccount send-sms` (re-deploy `paystack-init` and `paystack-webhook` too).
Extra secrets: `supabase secrets set TERMII_API_KEY=xxx TERMII_SENDER=YourSenderID PLATFORM_FEE_PCT=2` (set `TERMII_URL` if Termii gives your account a different base URL).
- **Annual plans, setup fee, SMS packs**: Paystack one-time payments (Plan and Tools tabs). All payments are logged in the `payments` table.
- **Per-payment fee**: vendors add their bank on the Tools tab (Paystack subaccount; bank details are not stored by us). Order > "Get payment link". You keep `PLATFORM_FEE_PCT` of each payment.
- **SMS reminders**: Termii, charged in credits. Register a sender ID with Termii first. Automatic WhatsApp messages need Meta's paid WhatsApp Business API, so reminders use SMS or one-tap WhatsApp links.
- **Referrals**: a vendor who signs up from `?ref=their-slug` earns the referrer 30 days after their first paid plan.
- **Group deals**: in Supabase > Table editor > `groups`, add a row (UPPERCASE `code`, `plan`, `expires_at`, `seats`). Collect the group's fee yourself and give vendors the code.
- **Partners**: add rows to `partners` (name, category, description, whatsapp). Charge them directly.
- In `paystack-collect`, change `shopa.app` in the placeholder customer email to a domain you own.
>>>>>>> 1862ba7 (Shopa Orders first version)
