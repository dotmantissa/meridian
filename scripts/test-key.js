import { createAccount } from 'genlayer-js';

try {
  const account = createAccount('0xd4479070c2a31da31a01e732ca51707132bacdb480aae432a0c8bd0b91eba4b7');
  console.log('Success! Address:', account.address);
} catch (e) {
  console.error('Failed to parse key:', e);
}
