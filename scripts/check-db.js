import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Fetch latest offers matching Graphics Designer or Udacity or Abuja
    const resOffers = await client.query(
      "SELECT id, role, company, city, base_salary, status, created_at FROM offers WHERE role ILIKE '%Graphics Designer%' OR company ILIKE '%Udacity%' OR city ILIKE '%Abuja%' ORDER BY created_at DESC"
    );
    console.log('--- MATCHING OFFERS ---');
    console.log(JSON.stringify(resOffers.rows, null, 2));

    if (resOffers.rows.length > 0) {
      const offerId = resOffers.rows[0].id;
      // Fetch matching report
      const resReports = await client.query(
        "SELECT * FROM analysis_reports WHERE offer_id = $1", [offerId]
      );
      console.log('--- MATCHING REPORTS ---');
      console.log(JSON.stringify(resReports.rows, null, 2));
    } else {
      // Fallback: Fetch latest 3 general offers
      const resLatest = await client.query(
        "SELECT id, role, company, city, base_salary, status, created_at FROM offers ORDER BY created_at DESC LIMIT 3"
      );
      console.log('--- LATEST OFFERS ---');
      console.log(JSON.stringify(resLatest.rows, null, 2));
    }

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

check();
