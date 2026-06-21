# Meridian

Job offer intelligence powered by on-chain consensus.

You got the job offer. But you do not know if the base salary is right for your role, your location, and your level of experience. You do not know if the equity structure is standard or a trap designed to dilute you. You either negotiate blind or you accept without pushing back, leaving thousands of dollars on the table.

Meridian changes that. It reads your offer details, benchmarks them against live market ranges on the blockchain, evaluates the equity clauses, and gives you customized talking scripts to handle the negotiation. The compensation secrets that previously lived only inside the heads of recruiter consultants are now available to you instantly.

## How it works

1. **Upload details**: Input the base salary, city, experience level, and equity details from your offer letter.
2. **Consensus validation**: GenLayer validators query live parameters, evaluate terms using independent models, and reach a consensus quorum on your target base and equity rating.
3. **Get your script**: Read specific negotiation talking points. Select your preferred tone (polite, assertive, or witty) and copy your customized email pitch.

## Architecture

* **Frontend**: Next.js App Router, React, and Vanilla CSS with full light/dark mode styling.
* **Authentication**: Privy for email only sign in and silent transaction abstraction.
* **Database**: Neon PostgreSQL for user storage and offer records.
* **Consensus**: GenLayer Intelligent Contract running leader-validator consensus over subjective LLM compensation reviews.

## Setup

### Prerequisites

* Node.js (version 18 or higher)
* GenLayer CLI (for contract changes and tests)
* Python 3.14+ (for local pytest verification)

### Environment configuration

Create a `.env` file at the root of the project with the following parameters:

```env
DATABASE_URL="your-neon-postgres-connection-string"
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-privy-app-secret"
GENLAYER_CONTRACT_ADDRESS="your-deployed-contract-address"
```

### Local development

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Sync the database tables:
   ```bash
   node scripts/db-init.js
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Direct mode tests (fast)
Verify contract execution locally using mock LLM responses:
```bash
pytest tests/direct/ -v
```

### Integration tests (consensus)
Run full leader-validator consensus tests against StudioNet:
```bash
gltest tests/integration/ -v -s --network studionet
```
