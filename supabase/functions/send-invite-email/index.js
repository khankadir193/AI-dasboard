// import { Resend } from 'resend'
import { Resend } from 'npm:resend'
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


    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL') || Deno.env.get('RESEND_FROM_EMAIL')
    if (!resendApiKey || !fromEmail) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured (Resend env missing)' }),
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

    const resend = new Resend(resendApiKey)

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html
    })

    return new Response(JSON.stringify({ ok: true, id: result?.id || null }), {
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

