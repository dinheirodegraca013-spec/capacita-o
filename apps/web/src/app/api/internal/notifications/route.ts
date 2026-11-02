import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { deliverPendingNotifications } from '@/modules/notifications/service';
import { buildProviderHeaders, buildResendNotification } from '@/modules/notifications/resend';

function isAuthorized(request: NextRequest) {
  const secret = process.env.NOTIFICATION_JOB_SECRET;
  if (!secret) return false;
  return request.headers.get('x-notification-job-secret') === secret
    || request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const providerUrl = process.env.EMAIL_PROVIDER_URL;
  const providerKey = process.env.EMAIL_PROVIDER_KEY;
  const from = process.env.EMAIL_FROM;
  if (!providerUrl || !providerKey || !from) return NextResponse.json({ error: 'EMAIL_PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  try {
    const supabase = createSupabaseAdminClient();
    const deliveryClient = {
      rpc: (name: 'claim_pending_notifications', args: { p_limit: number }) => supabase.rpc(name, args),
      update: (values: Record<string, unknown>) => ({
        eq: (column: string, value: string) => supabase.from('notification_outbox').update(values).eq(column, value),
      }),
    };
    const summary = await deliverPendingNotifications(deliveryClient as never, async (item) => {
      const recipient = await supabase.auth.admin.getUserById(item.recipient_user_id);
      const email = recipient.data.user?.email;
      if (recipient.error || !email) throw new Error('recipient_email_unavailable');
      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: buildProviderHeaders(providerKey, item.id),
        body: JSON.stringify(buildResendNotification({ from, to: email, template: item.template_key, payload: item.payload })),
      });
      if (!response.ok) throw new Error(`provider_${response.status}`);
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Notification worker failed' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) { return POST(request); }
