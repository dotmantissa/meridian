import { query } from './db';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

interface AnalyzeTaskParams {
  offerId: string;
  role: string;
  company: string;
  city: string;
  experienceYears: number;
  baseSalary: number;
}

// 1. Submit transaction to GenLayer contract (returns txHash immediately)
export async function submitOfferToContract(params: AnalyzeTaskParams): Promise<string> {
  const { offerId, role, company, city, experienceYears, baseSalary } = params;
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS || '0x98A85FDA15ECf862FE2cE5865e70bC6a7929A048';

  const privateKey = process.env.GENLAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GENLAYER_PRIVATE_KEY is not defined in environment variables');
  }

  const account = createAccount(privateKey as `0x${string}`);
  const client = createClient({
    chain: studionet,
    account: account,
  });

  console.log(`Submitting programmatic write transaction for offer ${offerId}...`);
  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'analyze_offer',
    args: [offerId, role, company, city, experienceYears, baseSalary],
    value: 0n,
  });

  return txHash;
}

// 2. Check transaction status and compile report if finalized
export async function checkAndUpdateOfferStatus(offerId: string, txHash: string): Promise<{ offer: any, report: any }> {
  const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS || '0x98A85FDA15ECf862FE2cE5865e70bC6a7929A048';

  const privateKey = process.env.GENLAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GENLAYER_PRIVATE_KEY is not defined in environment variables');
  }

  const account = createAccount(privateKey as `0x${string}`);
  const client = createClient({
    chain: studionet,
    account: account,
  });

  console.log(`Checking transaction receipt for ${txHash} (offer ${offerId})...`);

  let receipt: any;
  try {
    // Attempt to get receipt immediately with 0 retries
    receipt = await client.waitForTransactionReceipt({
      hash: txHash as any,
      status: 'FINALIZED' as any,
      interval: 1000,
      retries: 0,
    });
    console.log(`Receipt received for ${txHash}! Status: ${receipt.status_name || receipt.status}, Result Name: ${receipt.result_name}`);
  } catch (err: any) {
    const errMsg = err.message || '';
    const errMsgLower = errMsg.toLowerCase();
    console.log(`Transaction ${txHash} receipt check failed:`, errMsg);

    // If it is a generic not found/timeout error, it means transaction is still pending/processing
    const isPending = errMsgLower.includes('timeout') || errMsgLower.includes('timed out') || errMsgLower.includes('not found') || errMsgLower.includes('receipt') || errMsgLower.includes('pending');

    if (!isPending) {
      // Definitive contract execution error/receipt fetch error
      console.error(`Definitive failure for offer ${offerId} during receipt check:`, err);
      const offerRes = await query(
        "UPDATE offers SET status = 'failed' WHERE id = $1 RETURNING *",
        [offerId]
      );
      return {
        offer: offerRes.rows[0],
        report: null
      };
    }

    // Check if the transaction has been stuck in processing for too long (15 minutes)
    const offerRes = await query("SELECT * FROM offers WHERE id = $1", [offerId]);
    const offer = offerRes.rows[0];
    if (offer && offer.created_at) {
      const createdAt = new Date(offer.created_at).getTime();
      const now = Date.now();
      const minutesElapsed = (now - createdAt) / (1000 * 60);
      if (minutesElapsed > 15) {
        console.log(`Transaction ${txHash} for offer ${offerId} has been pending for ${minutesElapsed.toFixed(1)} minutes (stuck). Marking as failed.`);
        const updatedRes = await query(
          "UPDATE offers SET status = 'failed' WHERE id = $1 RETURNING *",
          [offerId]
        );
        return {
          offer: updatedRes.rows[0],
          report: null
        };
      }
    }

    // Still pending, just return current offer state
    return {
      offer: offerRes.rows[0],
      report: null
    };
  }

  // Handle consensus disagreement
  if (receipt.result_name === 'MAJORITY_DISAGREE') {
    console.log(`Consensus disagreed (MAJORITY_DISAGREE) for offer ${offerId}`);
    const offerRes = await query(
      "UPDATE offers SET status = 'failed' WHERE id = $1 RETURNING *",
      [offerId]
    );
    return {
      offer: offerRes.rows[0],
      report: null
    };
  }

  try {
    // Fetch the results using get_analysis from the contract that actually executed the transaction
    const targetContractAddress = receipt.recipient || receipt.contract_snapshot?.contract_address || contractAddress;
    console.log(`Fetching results from contract ${targetContractAddress} using get_analysis...`);
    const result = await client.readContract({
      address: targetContractAddress as `0x${string}`,
      functionName: 'get_analysis',
      args: [offerId],
    }) as any;

    if (!result) {
      throw new Error('Analysis result from contract is null');
    }

    console.log(`Successfully retrieved contract analysis data for offer ${offerId}:`, result);

    // Save report to DB (use ON CONFLICT to avoid duplicate reports if checked concurrently)
    const reportRes = await query(
      `INSERT INTO analysis_reports (
        offer_id, tx_hash, contract_address, 
        market_salary_min, market_salary_max, market_salary_median, 
        recommended_base, equity_rating, equity_advice, 
        negotiation_leverage, full_report_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (offer_id) DO UPDATE SET
        tx_hash = EXCLUDED.tx_hash,
        market_salary_min = EXCLUDED.market_salary_min,
        market_salary_max = EXCLUDED.market_salary_max,
        market_salary_median = EXCLUDED.market_salary_median,
        recommended_base = EXCLUDED.recommended_base,
        equity_rating = EXCLUDED.equity_rating,
        equity_advice = EXCLUDED.equity_advice,
        negotiation_leverage = EXCLUDED.negotiation_leverage,
        full_report_json = EXCLUDED.full_report_json
      RETURNING *`,
      [
        offerId,
        txHash,
        targetContractAddress,
        Number(result.market_min),
        Number(result.market_max),
        Number(result.market_median),
        Number(result.recommended_base),
        result.equity_rating,
        result.equity_advice,
        result.negotiation_points,
        JSON.stringify(result)
      ]
    );

    // Update status to completed
    const offerRes = await query(
      "UPDATE offers SET status = 'completed' WHERE id = $1 RETURNING *",
      [offerId]
    );

    console.log(`Consensus analysis for offer ${offerId} fully completed!`);
    return {
      offer: offerRes.rows[0],
      report: reportRes.rows[0]
    };

  } catch (err: any) {
    console.error(`Definitive failure retrieving analysis for offer ${offerId}:`, err);
    const offerRes = await query(
      "UPDATE offers SET status = 'failed' WHERE id = $1 RETURNING *",
      [offerId]
    );
    return {
      offer: offerRes.rows[0],
      report: null
    };
  }
}
