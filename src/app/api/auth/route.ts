import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, email } = await request.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });
    }

    // Insert user if they don't exist
    await query(
      `INSERT INTO users (id, email)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [id, email]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
