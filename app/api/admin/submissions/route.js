import { NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '../../../../lib/supabase';

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || '';
  if (adminEmail && userData.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const exam = searchParams.get('exam');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  let query = supabaseAdmin.from('submissions').select('*').order('created_at', { ascending: false });

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,cnp.ilike.%${q}%`);
  }

  if (exam) {
    query = query.eq('exam', exam);
  }

  if (date_from) {
    query = query.gte('created_at', `${date_from}T00:00:00`);
  }

  if (date_to) {
    query = query.lte('created_at', `${date_to}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}
