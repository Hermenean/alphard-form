import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function POST(req) {
  const formData = await req.formData();
  const first_name = formData.get('first_name')?.toString().trim();
  const last_name = formData.get('last_name')?.toString().trim();
  const birth_date = formData.get('birth_date')?.toString();
  const cnp = formData.get('cnp')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const exam = formData.get('exam')?.toString();

  if (!first_name || !last_name || !birth_date || !cnp || !phone || !email || !exam) {
    return NextResponse.redirect(new URL('/?error=Toate%20campurile%20sunt%20obligatorii.', req.url));
  }

  if (!/^[0-9]{13}$/.test(cnp)) {
    return NextResponse.redirect(new URL('/?error=CNP-ul%20trebuie%20sa%20aiba%2013%20cifre.', req.url));
  }

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL('/?error=Configurare%20server%20incompleta.', req.url));
  }

  const { error } = await supabaseAdmin.from('submissions').insert({
    first_name,
    last_name,
    birth_date,
    cnp,
    phone,
    email,
    exam
  });

  if (error) {
    return NextResponse.redirect(new URL('/?error=Eroare%20la%20salvare.', req.url));
  }

  return NextResponse.redirect(new URL('/?success=1', req.url));
}
