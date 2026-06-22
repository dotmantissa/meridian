import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAndUpdateOfferStatus } from '@/lib/analyzer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing offer id' }, { status: 400 });
    }

    // Fetch offer
    const offerRes = await query('SELECT * FROM offers WHERE id = $1', [id]);
    if (offerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    let offer = offerRes.rows[0];

    // Fetch report
    const reportRes = await query('SELECT * FROM analysis_reports WHERE offer_id = $1', [id]);
    let report = reportRes.rows.length > 0 ? reportRes.rows[0] : null;

    // If offer is processing and has a transaction hash, but report is not compiled yet, check status
    if (offer.status === 'processing' && offer.tx_hash && !report) {
      const checkResult = await checkAndUpdateOfferStatus(offer.id, offer.tx_hash);
      offer = checkResult.offer;
      report = checkResult.report;
    }

    return NextResponse.json({ offer, report });
  } catch (err: any) {
    console.error('Offer detail GET API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
