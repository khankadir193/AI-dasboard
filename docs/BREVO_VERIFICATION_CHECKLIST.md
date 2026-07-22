# Resend → Brevo Migration - Verification Checklist

## Pre-Migration Verification (Code Review)

### Code Changes
- [ ] **Imports:** Resend import removed from [supabase/functions/send-invite-email/index.js](supabase/functions/send-invite-email/index.js)
- [ ] **Line 1:** Only imports `createClient` from Supabase
- [ ] **Env vars:** BREVO_API_KEY read (not RESEND_API_KEY)
- [ ] **Env vars:** INVITE_FROM_EMAIL read (not RESEND_FROM_EMAIL)
- [ ] **Error messages:** "Brevo" instead of "Resend"

### Validation Added
- [ ] **Email validation:** Recipient email regex check present
- [ ] **Email validation:** Sender email regex check present  
- [ ] **Token validation:** Token non-empty string check present
- [ ] **Link validation:** Invite link format check present

### Error Handling
- [ ] **Fetch errors:** try-catch around fetch() call
- [ ] **Parse errors:** try-catch around brevoResponse.json()
- [ ] **API errors:** Checks !brevoResponse.ok before success
- [ ] **Status codes:** Returns 400/500/503 appropriately

### Logging
- [ ] **Info logs:** `[Invite] Creating invite email for:`
- [ ] **Info logs:** `[Invite] Sending email via Brevo to:`
- [ ] **Success logs:** `[Invite] Email sent successfully via Brevo:`
- [ ] **Error logs:** All error paths have console.error with [Invite] prefix

### API Integration
- [ ] **Endpoint:** Uses https://api.brevo.com/v3/smtp/email
- [ ] **Method:** POST with correct headers
- [ ] **Auth:** Uses 'api-key' header with BREVO_API_KEY
- [ ] **Body:** JSON with sender, to, subject, htmlContent, replyTo

### No Breaking Changes
- [ ] **Frontend API:** Endpoint path unchanged (/send-invite-email)
- [ ] **Request format:** Still accepts { inviteId }
- [ ] **Response format:** Still returns { ok, id/error }
- [ ] **Database:** No schema changes required

---

## Pre-Deployment Setup (Infrastructure)

### Brevo Account
- [ ] Brevo account created at https://app.brevo.com
- [ ] Billing set up (free tier or paid)
- [ ] Sender email verified (Settings → Senders & Email Addresses)
- [ ] Sender email is exact match for INVITE_FROM_EMAIL

### API Key
- [ ] API key generated (Settings → API Keys → SMTP)
- [ ] Key format: `xkeysib_...`
- [ ] Key copied to clipboard (don't lose it!)
- [ ] Key has SMTP access enabled
- [ ] Key has transactional emails enabled

### Supabase Secrets (Staging)
- [ ] Access Supabase Dashboard → Project Settings → Edge Functions → Secrets
- [ ] Added new secret: `BREVO_API_KEY` = `xkeysib_...`
- [ ] Value verified (paste once, double-check for spaces)
- [ ] Verified INVITE_FROM_EMAIL exists
- [ ] Verified APP_URL exists and correct
- [ ] Saved changes

### Code Deployment (Staging)
- [ ] Code change committed to git
- [ ] Deployed Edge Function to staging: `supabase functions deploy send-invite-email --project-id=staging-id`
- [ ] Function shows "Active" in Supabase dashboard
- [ ] No errors during deployment

---

## Staging Testing (Before Production)

### Create Test Invite
- [ ] Logged in as admin in staging
- [ ] Navigated to Team Management → Users → Add Member
- [ ] Entered test email: `staging-test-USER@example.com` (use unique email)
- [ ] Selected role: Analyst
- [ ] Clicked "Send Invite"
- [ ] Got success message (no error)

### Verify Email Sent
- [ ] Check test email inbox (should arrive within 30 seconds)
- [ ] Email from: Matches INVITE_FROM_EMAIL
- [ ] Email subject: "Invitation to join [Company Name]"
- [ ] Email body: Contains company name, role, "Accept Invitation" button
- [ ] Email link: Correct format https://staging.company.com/invite/[TOKEN]
- [ ] Email link: No localhost URLs

### Check Logs
- [ ] Supabase Dashboard → Functions → send-invite-email → Logs
- [ ] Search for test email address
- [ ] Should see:
  ```
  [Invite] Creating invite email for: staging-test-USER@example.com
  [Invite] Sending email via Brevo to: staging-test-USER@example.com
  [Invite] Email sent successfully via Brevo: {messageId}
  ```
- [ ] No error messages
- [ ] No timeouts or network errors

### Test Acceptance Flow
- [ ] Clicked invite link in test email
- [ ] Page loaded correctly (no 404 or auth errors)
- [ ] Email pre-filled in form
- [ ] Entered password
- [ ] Clicked sign up
- [ ] Account created
- [ ] If email verification required, confirmed email
- [ ] Automatically joined company
- [ ] User appears in Team Management with status "Active"
- [ ] Can login with new account
- [ ] Dashboard loads and shows company data

### Test Resend Invite (Existing Invite)
- [ ] Created another test invite in staging
- [ ] Went back to Team Management → Users
- [ ] Found pending invite (status: "Pending")
- [ ] Clicked "Resend" button
- [ ] Got success message
- [ ] New email arrived
- [ ] Email link works

### Error Case Testing
- [ ] **Invalid email:** Try add invite with email like "notanemail"
  - Expect: Validation error from frontend (before sending to Edge Function)
- [ ] **Check logs:** No invitation attempt in logs
- [ ] **Check Brevo:** No attempt in Brevo dashboard

### Staging Sign-Off
- [ ] All tests above: ✅ PASSED
- [ ] Ready for production: ✅ YES
- [ ] Known issues: ________________
- [ ] Notes: ________________________

---

## Production Deployment Setup

### Add Secret to Production
- [ ] Access Supabase Dashboard → Project Settings (PRODUCTION)
- [ ] Edge Functions → Secrets
- [ ] Added new secret: `BREVO_API_KEY` = `xkeysib_...`
- [ ] Verified value exactly matches staging value
- [ ] Double-checked: no extra spaces, correct format

### Deploy to Production
- [ ] Confirmed deployment target is production
- [ ] Ran: `supabase functions deploy send-invite-email --project-id=prod-id`
- [ ] Function deployed successfully
- [ ] Supabase dashboard shows function is Active
- [ ] Verified no errors in deployment

### Initial Production Verification (First 30 min)
- [ ] Created 1-2 test invites with admin account
- [ ] Test emails received (within 30 sec)
- [ ] Email formatting correct
- [ ] Links work correctly
- [ ] Check function logs for: `[Invite] Email sent successfully via Brevo:`
- [ ] No errors in logs
- [ ] Test clicking one invite link
- [ ] Signup flow works end-to-end

---

## Post-Deployment Monitoring (First 24 Hours)

### Immediate (First Hour)
- [ ] Monitor function logs for errors
- [ ] Look for pattern: `[Invite] Email failed`
- [ ] Check if any support tickets filed about invites
- [ ] Verify real user can create and receive invite

### First 4 Hours
- [ ] Monitor invite success rate
- [ ] Check Brevo dashboard → Statistics → Sent
- [ ] Verify delivery rate > 90%
- [ ] Look for any spam complaints (should be 0)
- [ ] Continue monitoring logs

### First 24 Hours
- [ ] Invite creation working normally
- [ ] Email delivery consistent
- [ ] No bounce rate spike
- [ ] No unsubscribe spike
- [ ] User acceptance rate normal
- [ ] No acceptance flow errors

### Success Metrics
- [ ] Invites sent: 100%
- [ ] Emails delivered: > 95%
- [ ] Bounce rate: < 2%
- [ ] Complaint rate: < 0.1%
- [ ] Acceptance rate: Normal (baseline)

---

## Post-Deployment Monitoring (Week 1)

### Daily Checks
- [ ] Function logs: No errors
- [ ] Brevo statistics: Delivery rate > 95%
- [ ] Support tickets: No invite-related issues
- [ ] User feedback: No complaints
- [ ] Database: Invites table growing normally

### End of Week Review
- [ ] Total invites sent: _______ (baseline check)
- [ ] Total emails delivered: _______
- [ ] Acceptance rate: _______ (compare to pre-migration)
- [ ] Support tickets: _______ (should be 0)
- [ ] Brevo reputation score: _______ (should be 100)
- [ ] Production status: ✅ STABLE

### Weekly Tasks
- [ ] Review Brevo dashboard for trends
- [ ] Check bounce list for bad emails
- [ ] Monitor spam complaints (should stay at 0)
- [ ] Verify sender reputation
- [ ] Archive old logs

---

## Post-Migration Cleanup

### After 1 Week (if all stable)
- [ ] Production verified stable for 7+ days
- [ ] No rollback needed
- [ ] Remove old Resend documentation (optional)
- [ ] Update team wiki/docs to mention Brevo
- [ ] Deactivate RESEND_API_KEY in Resend dashboard (optional)

### Keep in Supabase (for reference)
- [ ] Keep BREVO_API_KEY secret
- [ ] You may optionally keep RESEND_API_KEY if paranoid about rollback
- [ ] No harm keeping both while only using one

### Archive
- [ ] Save BREVO_MIGRATION.md to project documentation
- [ ] Save BREVO_DEPLOYMENT_GUIDE.md to runbooks
- [ ] Tag git commit with: `migrate/resend-to-brevo`
- [ ] Update CHANGELOG.md with migration note

---

## Rollback Checklist (If Issues Occur)

### Rollback Decision
- [ ] Issue confirmed production (not staging)
- [ ] Cause isolated to Brevo migration
- [ ] Issue significant enough to warrant rollback
- [ ] Got approval from team lead

### Rollback Execution
- [ ] Checked git history for last Resend version
- [ ] Reverted [supabase/functions/send-invite-email/index.js](supabase/functions/send-invite-email/index.js) to Resend version
- [ ] Re-added RESEND_API_KEY to Supabase secrets (if removed)
- [ ] Deployed: `supabase functions deploy send-invite-email --project-id=prod-id`
- [ ] Verified function Active in Supabase dashboard

### Verification After Rollback
- [ ] Created test invite
- [ ] Email received
- [ ] Email shows Resend is sending (look at logs)
- [ ] Acceptance flow works
- [ ] Production stable again

### Post-Rollback Analysis
- [ ] Investigated root cause of failure
- [ ] Documented issue in incident report
- [ ] Fixed underlying problem
- [ ] Plan to retry migration (if safe)
- [ ] Updated this checklist based on lessons learned

---

## Sign-Off

**Code Review:** _______________  Date: _______

**Staging QA:** _______________  Date: _______

**Production Deployment:** _______________  Date: _______

**Production Verification:** _______________  Date: _______

**Week 1 Sign-Off:** _______________  Date: _______

---

## Quick Command Reference

```bash
# Deploy to staging
supabase functions deploy send-invite-email --project-id=YOUR_STAGING_ID

# Deploy to production
supabase functions deploy send-invite-email --project-id=YOUR_PROD_ID

# View function logs (follow mode)
supabase functions logs send-invite-email --project-id=YOUR_ID --limit 50

# Check function status
supabase functions list --project-id=YOUR_ID

# Test Brevo API manually
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: xkeysib_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender":{"email":"from@example.com"},
    "to":[{"email":"to@example.com"}],
    "subject":"Test",
    "htmlContent":"<p>Test</p>"
  }'
```

---

**Verification Complete ✅**
