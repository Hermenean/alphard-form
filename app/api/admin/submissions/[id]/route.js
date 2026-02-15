import { NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '../../../../../lib/supabase';

async function authorize(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return { ok: false, status: 401 };
  if (!supabaseServer) return { ok: false, status: 500 };

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData?.user) return { ok: false, status: 401 };

  const adminEmail = process.env.ADMIN_EMAIL || '';
  if (adminEmail && userData.user.email !== adminEmail) return { ok: false, status: 403 };

  if (!supabaseAdmin) return { ok: false, status: 500 };
  return { ok: true };
}

export async function PATCH(req, { params }) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const done = !!body.done;

  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ done })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('submissions')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
