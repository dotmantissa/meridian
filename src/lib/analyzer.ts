import { exec } from 'child_process';
import { query } from './db';

interface AnalyzeTaskParams {
  offerId: string;
  role: string;
  company: string;
  city: string;
  experienceYears: number;
  baseSalary: number;
}

export function runBackgroundAnalysis(params: AnalyzeTaskParams) {
  const { offerId, role, company, city, experienceYears, baseSalary } = params;
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS || '0x4eA97197F99294438bAfbef521Bf5C68ae43d176';

  // Return a promise but don't await it in the route so it runs asynchronously
  (async () => {
    try {
      console.log(`Starting background consensus analysis for offer ${offerId}...`);
      
      // Update status to processing
      await query("UPDATE offers SET status = 'processing' WHERE id = $1", [offerId]);

      // Construct CLI command. Note: We use double quotes for arguments
      // Escaping special characters in strings for powershell/cmd compatibility
      const safeRole = role.replace(/"/g, '\\"');
      const safeCompany = company.replace(/"/g, '\\"');
      const safeCity = city.replace(/"/g, '\\"');

      const cmd = `echo meridian123| genlayer write ${contractAddress} analyze_offer --args "${offerId}" "${safeRole}" "${safeCompany}" "${safeCity}" ${experienceYears} ${baseSalary}`;
      
      console.log(`Running GenLayer command: ${cmd}`);

      exec(cmd, { timeout: 300000 }, async (error, stdout, stderr) => {
        if (error) {
          console.error(`CLI execution error for offer ${offerId}:`, error);
          console.error(`stderr: ${stderr}`);
          await query("UPDATE offers SET status = 'failed' WHERE id = $1", [offerId]);
          return;
        }

        console.log(`CLI write stdout for ${offerId}:\n`, stdout);

        // Try to extract Transaction Hash and Contract Address
        const txHashMatch = stdout.match(/'Transaction Hash':\s*'([0-9a-fxA-FX]+)'/);
        const txHash = txHashMatch ? txHashMatch[1] : null;

        if (!txHash) {
          console.error(`Failed to parse transaction hash for offer ${offerId}`);
          await query("UPDATE offers SET status = 'failed' WHERE id = $1", [offerId]);
          return;
        }

        console.log(`Transaction submitted! Hash: ${txHash}. Fetching result...`);

        // Fetch the results using get_analysis
        const readCmd = `genlayer call ${contractAddress} get_analysis --args "${offerId}"`;
        exec(readCmd, async (readError, readStdout, readStderr) => {
          if (readError) {
            console.error(`CLI read error for offer ${offerId}:`, readError);
            await query("UPDATE offers SET status = 'failed' WHERE id = $1", [offerId]);
            return;
          }

          try {
            console.log(`CLI read stdout for ${offerId}:\n`, readStdout);

            // Extract the JSON portion from the read stdout
            const resultIndex = readStdout.indexOf('Result:');
            if (resultIndex === -1) {
              throw new Error('Result marker not found in output');
            }

            const jsonStr = readStdout.substring(resultIndex + 7).trim();
            // Parse custom formatted JS object output by CLI.
            // On Windows, the CLI outputs formatted JS object (not strict JSON, keys without quotes etc.)
            // We can parse it by evaluating or running a regex parser, or we can use a safe evaluator
            // Since we know the schema, we can parse it dynamically
            const data = parseCliResultObject(jsonStr);

            console.log(`Successfully parsed contract data for offer ${offerId}:`, data);

            // Insert report details into database
            await query(
              `INSERT INTO analysis_reports (
                offer_id, tx_hash, contract_address, 
                market_salary_min, market_salary_max, market_salary_median, 
                recommended_base, equity_rating, equity_advice, 
                negotiation_leverage, full_report_json
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                offerId,
                txHash,
                contractAddress,
                data.market_min,
                data.market_max,
                data.market_median,
                data.recommended_base,
                data.equity_rating,
                data.equity_advice,
                data.negotiation_points,
                JSON.stringify(data)
              ]
            );

            // Update status to completed
            await query("UPDATE offers SET status = 'completed' WHERE id = $1", [offerId]);
            console.log(`Consensus analysis for offer ${offerId} fully completed!`);

          } catch (parseErr: any) {
            console.error(`Failed to parse/save read results for offer ${offerId}:`, parseErr);
            await query("UPDATE offers SET status = 'failed' WHERE id = $1", [offerId]);
          }
        });
      });

    } catch (err) {
      console.error(`Error in runBackgroundAnalysis for offer ${offerId}:`, err);
      await query("UPDATE offers SET status = 'failed' WHERE id = $1", [offerId]);
    }
  })();
}

// Helper function to parse Javascript-like object formats printed by genlayer-js CLI
function parseCliResultObject(str: string): any {
  // Replace single quotes with double quotes for JSON parsing
  // Handle keys without quotes (e.g. city: 'London' -> "city": "London")
  try {
    // A quick, safe way is using Function() constructor to evaluate it as a JS object since it's locally generated CLI output
    const fn = new Function(`return ${str};`);
    return fn();
  } catch (e) {
    console.warn('Function evaluation failed, trying regex parser...', e);
    // Fallback regex cleaning
    let clean = str
      .replace(/'/g, '"')
      .replace(/(\w+):\s*"/g, '"$1": "')
      .replace(/(\w+):\s*(\d+)/g, '"$1": $2')
      .replace(/(\w+):\s*(\[|\{)/g, '"$1": $2');
    return JSON.parse(clean);
  }
}
