# Resend → Brevo Migration - Deployment Guide

## Quick Summary
**Migration Type:** Email Provider Switch (Resend → Brevo)  
**Risk Level:** LOW - Single function, zero breaking changes  
**Files Changed:** 1  
**Rollback Time:** < 1 minute  

---

## Pre-Deployment Checklist

### 1. Brevo Account Setup
- [ ] Brevo account created (https://app.brevo.com)
- [ ] API key generated with SMTP access
- [ ] Sender email verified in Brevo dashboard
- [ ] Verified email matches `INVITE_FROM_EMAIL`

### 2. Environment Configuration
- [ ] `BREVO_API_KEY` ready to add
- [ ] Verify `INVITE_FROM_EMAIL` is correct
- [ ] Verify `APP_URL` is correct
- [ ] Current `RESEND_API_KEY` can be deactivated after verification

### 3. Code Review
- [ ] Review [supabase/functions/send-invite-email/index.js](supabase/functions/send-invite-email/index.js)
- [ ] Verify no Resend code remains
- [ ] Check all error messages are appropriate

### 4. Staging Testing
- [ ] Deploy to staging first
- [ ] Test invite creation in staging
- [ ] Verify email received
- [ ] Verify invite link works
- [ ] Check logs: `[Invite] Email sent successfully via Brevo:`

---

## Deployment Steps

### Step 1: Add Brevo Secret to Supabase (Staging)

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets

Key: BREVO_API_KEY
Value: xkeysib_<your-brevo-api-key>

# Confirm value matches exactly (no extra spaces)
```

### Step 2: Deploy Edge Function to Staging

```bash
# Supabase CLI
supabase functions deploy send-invite-email --project-id=<staging-id>

# Verify deployment
# Check Supabase Functions dashboard - should show green status
```

### Step 3: Test in Staging

```bash
# Create test invite
1. Go to staging Team Management page
2. Add new invite
3. Enter test user email
4. Click "Send Invite"
5. Check function logs (should see: "Email sent successfully via Brevo")
6. Verify email received
7. Test clicking invite link
8. Complete signup flow
9. Verify user joined correct company
```

### Step 4: Review Logs (Staging)

```bash
# In Supabase Dashboard → Functions → send-invite-email → Logs

Expected logs:
✅ [Invite] Creating invite email for: test@example.com
✅ [Invite] Sending email via Brevo to: test@example.com
✅ [Invite] Email sent successfully via Brevo: {messageId}

Unexpected logs:
❌ [Invite] Email failed with Brevo error:
❌ [Invite] Email fetch error:
❌ Server misconfigured
```

### Step 5: Deploy to Production (if staging passes)

```bash
# Add Brevo secret to production
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
Key: BREVO_API_KEY
Value: xkeysib_<your-brevo-api-key>

# Deploy to production
supabase functions deploy send-invite-email --project-id=<prod-id>

# Verify deployment
# Check Supabase Functions dashboard - should show green status
```

### Step 6: Verify Production

```bash
# Monitor invites in production
# Check function logs
# Watch for: [Invite] Email sent successfully via Brevo:

# If needed, test with admin account
# Create 1-2 test invites, verify emails sent
```

### Step 7: Deactivate Resend (Optional)

```bash
# After confirming Brevo working for 24+ hours:
# 1. Deactivate RESEND_API_KEY in Resend dashboard
# 2. You may keep for emergency rollback if desired
# 3. No need to remove from Supabase secrets immediately
```

---

## Monitoring Checklist

### Daily for First Week
- [ ] Check Edge Function logs for errors
- [ ] Verify invites being sent successfully
- [ ] Monitor invite acceptance rates
- [ ] Check Brevo dashboard for bounce/complaint rate
- [ ] Search logs for: `[Invite] Email failed`

### Weekly
- [ ] Review Brevo dashboard statistics
- [ ] Check for any rejected emails
- [ ] Monitor delivery rates
- [ ] Confirm no support tickets about invites

---

## Rollback Procedure (If Issues)

### Option 1: Quick Rollback (Keep Staging Test)

```bash
# 1. Revert to Resend version from git
git checkout <commit-hash> -- supabase/functions/send-invite-email/index.js

# 2. Re-add RESEND_API_KEY to Supabase secrets (if removed)
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
Key: RESEND_API_KEY
Value: <your-resend-api-key>

# 3. Deploy
supabase functions deploy send-invite-email --project-id=<prod-id>

# 4. Verify by testing an invite
# Should see: Resend sending instead of Brevo
```

### Option 2: Full Rollback + Staging Retest

```bash
# If needed to completely restart:
# 1. Revert code
# 2. Keep BREVO_API_KEY secret in Supabase (no harm)
# 3. Deploy previous version
# 4. Test again
# 5. Retry Brevo migration after investigation
```

---

## Incident Response

### Issue: Emails Not Sending

**Symptom:** Invites created but emails not arriving  
**Logs show:** ERROR or TIMEOUT

**1. Check Brevo Secret**
```bash
# Verify in Supabase → Project Settings → Secrets
BREVO_API_KEY=xkeysib_... (check format, no spaces)
```

**2. Test Brevo Connectivity**
```bash
# Test API directly
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: xkeysib_..." \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {"name": "Test", "email": "sender@domain.com"},
    "to": [{"email": "test@example.com"}],
    "subject": "Test",
    "htmlContent": "<p>Test</p>"
  }'

# Should return 201 with messageId
```

**3. Check Sender Email**
```bash
# Verify in Brevo dashboard
# Settings → Senders & Email Addresses
# Your INVITE_FROM_EMAIL must be verified
```

**4. Check Logs for Details**
```bash
# In Supabase Functions logs
# Look for: [Invite] Email failed with Brevo error:
# Error message will tell you what Brevo rejected
```

### Issue: API Key Errors

**Symptom:** Status 401 Unauthorized from Brevo  
**Fix:**
```bash
# 1. Get new API key from https://app.brevo.com/settings/keys/api
# 2. Update BREVO_API_KEY in Supabase secrets
# 3. Redeploy function
# 4. Test with new invite
```

### Issue: Emails Going to Spam

**Cause:** Sender not verified, poor SPF/DKIM setup  
**Fix:**
```bash
# 1. Verify sender in Brevo → Senders & Email Addresses
# 2. Check SPF/DKIM records configured
# 3. Improve from-name (use company name instead of generic)
# 4. Use Brevo reputation tool to monitor sender score
```

---

## Rollback Decision Tree

```
Emails not being sent?
├─ Yes
│  └─ Check Brevo status page & API key → Fix or Rollback
└─ No
   └─ Emails going to spam?
      ├─ Yes → Check sender verification
      └─ No → Success! Monitor and continue
```

---

## Success Criteria

✅ Migration is successful when:

- [ ] Invites created in production send emails via Brevo
- [ ] Logs show `[Invite] Email sent successfully via Brevo:` 
- [ ] Users receive invitation emails
- [ ] Invite links work and signup completes
- [ ] Users automatically join correct company
- [ ] No errors in Edge Function logs
- [ ] < 1% bounce rate in Brevo
- [ ] All acceptance flow works (users can signin after accepting)

---

## Timeline

```
Day 0: Deploy to Staging
│      - Add BREVO_API_KEY secret
│      - Deploy Edge Function
│      - Manual testing (1-2 hours)
│      - Verify email delivery
│      - Test full acceptance flow
│
Day 1+: Production Deployment (if Staging OK)
│       - Add BREVO_API_KEY to production secrets
│       - Deploy Edge Function
│       - Monitor logs and success rate
│       - Continue for 24+ hours without issues
│
Day 7+: Deactivate Resend (Optional)
        - Turn off RESEND_API_KEY access
        - Keep backup if paranoid
```

---

## Support Contact

If issues arise during deployment:

1. **Check logs first:** Supabase Dashboard → Functions → send-invite-email → Logs
2. **Search for error pattern:** Look for `[Invite]` prefix
3. **Review BREVO_MIGRATION.md:** For detailed troubleshooting
4. **Brevo Support:** https://app.brevo.com/support

---

## Documentation Links

- [Brevo SMTP API](https://developers.brevo.com/reference/sendtransacemail)
- [Supabase Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Migration Details](./BREVO_MIGRATION.md)

---

## Sign-Off Template

```markdown
Production Deployment Sign-Off

Date: _______________
Deployed By: _______________
Reviewed By: _______________

Pre-Deployment Checklist: ✅ COMPLETE
Staging Test Results: ✅ PASSED
Logs Reviewed: ✅ APPROVED
Monitoring Set Up: ✅ READY

Status: ✅ APPROVED FOR PRODUCTION
Notes: _________________________________
```

---

**Ready to deploy! Good luck! 🚀**
