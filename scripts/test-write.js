import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function run() {
  try {
    console.log('Initializing GenLayer client...');
    const account = createAccount('0xd4479070c2a31da31a01e732ca51707132bacdb480aae432a0c8bd0b91eba4b7');
    const client = createClient({
      chain: studionet,
      account: account,
    });
    
    console.log('Account Address:', account.address);
    console.log('Contract Address: 0x4eA97197F99294438bAfbef521Bf5C68ae43d176');

    // Generate a unique test offer ID
    const testOfferId = 'test_sdk_' + Math.floor(Math.random() * 1000000);
    console.log(`Sending write transaction for offer ${testOfferId}...`);

    const txHash = await client.writeContract({
      address: '0x4eA97197F99294438bAfbef521Bf5C68ae43d176',
      functionName: 'analyze_offer',
      args: [testOfferId, 'Graphics Designer', 'Udacity', 'Abuja, Nigeria', 7, 1000],
    });

    console.log('Transaction submitted! Hash:', txHash);
    console.log('Waiting for transaction receipt (consensus)...');

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: 'FINALIZED',
      interval: 3000,
      retries: 100,
    });

    console.log('Receipt received! Status:', receipt.status);
    
    console.log('Reading resulting analysis from contract...');
    const result = await client.readContract({
      address: '0x4eA97197F99294438bAfbef521Bf5C68ae43d176',
      functionName: 'get_analysis',
      args: [testOfferId],
    });

    console.log('Analysis Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error during write/read test:', error);
  }
}

run();
