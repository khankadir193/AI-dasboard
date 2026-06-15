import { createClient } from 'npm:@supabase/supabase-js'

// Simple, production-safe invite email sender.
// Payload: { inviteId }

const allowedRoles = new Set(['admin', 'manager', 'analyst', 'viewer'])


const normalizeRole = (role) => String(role || '').toLowerCase().trim()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }


    const { inviteId } = await req.json().catch(() => ({}))

    if (!inviteId || typeof inviteId !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'inviteId is required' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }


    const supabaseUrl = Deno.env.get('SUPABASE_URL')

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {

      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured (Supabase env missing)' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }


    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL')
    if (!brevoApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured (Brevo env missing)' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('VITE_APP_URL')
    if (!appUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured (APP_URL missing)' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }


    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,

      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`
          }
        }
      }
    )




    // Fetch invite
    const { data: invite, error: inviteErr } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle()

    if (inviteErr) {
      return new Response(
        JSON.stringify({ ok: false, error: inviteErr.message }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!invite) {
      return new Response(JSON.stringify({ ok: false, error: 'Invite not found' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    const status = invite?.status
    if (status !== 'pending') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invite is not pending' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const expiresAt = invite?.expires_at
    if (expiresAt) {
      const exp = new Date(expiresAt)
      if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        return new Response(JSON.stringify({ ok: false, error: 'Invite expired' }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }
    }


    const normalizedRole = normalizeRole(invite?.role)
    if (!allowedRoles.has(normalizedRole)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid invite role' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const email = invite?.email
    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invite email missing' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const token = invite?.token
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invite token missing' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }


    // Fetch company/workspace name (for email)
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('name')
      .eq('id', invite?.company_id)
      .maybeSingle()

    if (companyErr) {
      return new Response(JSON.stringify({ ok: false, error: companyErr.message }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }


    const companyName = company?.name || 'your workspace'

    const inviteLink = `${String(appUrl).replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`

    console.log("[Invite] Creating invite email for:", email)

    const subject = `Invitation to join ${companyName}`
    const roleLabel =
      normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #111827;">
        <p>You've been invited to join <strong>${companyName}</strong> as <strong>${roleLabel}</strong>.</p>
        <p style="margin-top: 16px;">If you weren't expecting this invitation, you can ignore this email.</p>
        <div style="margin-top: 22px;">
          <a href="${inviteLink}" style="display:inline-block; padding: 10px 16px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Accept Invitation</a>
        </div>
        <p style="margin-top: 14px; font-size: 12px; color: #6b7280;">Invite link: <span style="word-break: break-all;">${inviteLink}</span></p>
      </div>
    `

    // Validate all required data before sending
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.error("[Invite] Invalid recipient email:", email)
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid recipient email' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!fromEmail || !fromEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.error("[Invite] Invalid sender email:", fromEmail)
      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured (invalid sender email)' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate invite token exists and is not empty
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error("[Invite] Invalid or missing invite token")
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid invite token' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate invite link is properly formed
    if (!inviteLink.startsWith('http') || !inviteLink.includes('/invite/')) {
      console.error("[Invite] Malformed invite link:", inviteLink)
      return new Response(
        JSON.stringify({ ok: false, error: 'Malformed invite link' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log("[Invite] Sending email via Brevo to:", email)

    // Extract recipient name from email, fallback to "Invited User"
    const recipientName = (email?.split?.('@')?.[0] || '').trim() || 'Invited User'
    const senderName = 'InsightAI'

    // Build Brevo SMTP API payload (v3)
    // https://developers.brevo.com/reference/sendtransacemail
    const brevoPayload = {
      sender: {
        name: senderName,
        email: fromEmail
      },
      to: [
        {
          email: email,
          name: recipientName
        }
      ],
      subject: subject,
      htmlContent: html,
      replyTo: {
        email: fromEmail
        // Brevo accepts replyTo email only; keep minimal to avoid undefined fields.
      }
    }


    console.log("[Invite] Brevo payload:", JSON.stringify(brevoPayload, null, 2))

    // Send via Brevo API
    let brevoResponse
    try {
      brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(brevoPayload)
      })
    } catch (fetchErr) {
      console.error("[Invite] Email fetch error:", fetchErr?.message || fetchErr)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to send email (network error)' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Parse Brevo response
    let brevoBody
    try {
      brevoBody = await brevoResponse.json()
    } catch (parseErr) {
      console.error("[Invite] Failed to parse Brevo response:", parseErr?.message || parseErr)
      console.error("[Invite] Brevo response status:", brevoResponse.status)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to parse email service response' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Check for Brevo API errors
    if (!brevoResponse.ok) {
      const errorMsg = brevoBody?.message || brevoBody?.error || `Brevo returned status ${brevoResponse.status}`
      console.error("[Invite] Email failed with Brevo error:", errorMsg)
      console.error("[Invite] Brevo response body:", JSON.stringify(brevoBody))
      return new Response(
        JSON.stringify({ ok: false, error: `Email service error: ${errorMsg}` }),
        {
          status: brevoResponse.status >= 500 ? 503 : 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Success: Brevo returns messageId in response
    const messageId = brevoBody?.messageId || brevoBody?.id || null
    console.log("[Invite] Email sent successfully via Brevo:", messageId)

    return new Response(JSON.stringify({ ok: true, id: messageId }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Unknown error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }

})

