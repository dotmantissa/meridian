import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { runBackgroundAnalysis } from '@/lib/analyzer';

// GET: Retrieve all offers for a specific user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const res = await query(
      `SELECT o.*, r.market_salary_median, r.recommended_base, r.equity_rating
       FROM offers o
       LEFT JOIN analysis_reports r ON o.id = r.offer_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ offers: res.rows });
  } catch (err: any) {
    console.error('Offers GET API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Upload/Create a new offer and trigger analysis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, role, company, city, experienceYears, 
      baseSalary, equity, signOn, rawText 
    } = body;

    // Validate parameters
    if (!userId || !role || !company || !city || experienceYears === undefined || !baseSalary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert offer in pending status
    const insertRes = await query(
      `INSERT INTO offers (
        user_id, role, company, city, experience_years, 
        base_salary, equity, sign_on, status, raw_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      RETURNING *`,
      [
        userId, role, company, city, parseInt(experienceYears), 
        parseFloat(baseSalary), equity || null, parseFloat(signOn || 0), rawText || null
      ]
    );

    const newOffer = insertRes.rows[0];

    // Trigger GenLayer analysis in the background
    runBackgroundAnalysis({
      offerId: newOffer.id,
      role: newOffer.role,
      company: newOffer.company,
      city: newOffer.city,
      experienceYears: newOffer.experience_years,
      baseSalary: parseFloat(newOffer.base_salary)
    });

    return NextResponse.json({ offer: newOffer });
  } catch (err: any) {
    console.error('Offers POST API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
