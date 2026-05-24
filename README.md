# Nexus Drift

Nexus Drift is an autonomous organizational cognition engine that transforms fragmented organizational knowledge — commits, tickets, decisions, conversations — into a living, queryable intelligence layer. Built for the Build with Gemini XPRIZE hackathon.

## What It Does

Organizations lose institutional memory every time an engineer leaves, a decision goes undocumented, or context gets buried in Slack threads. Nexus Drift continuously ingests signals from GitHub, Jira, Slack, and Confluence, extracts entities and decisions using Gemini 2.5 Flash, and writes them into a temporal knowledge graph. The system then reasons over that graph autonomously to surface risks, contradictions, and opportunities before they become incidents.

### Core Capabilities

**Organizational Time Machine** — reconstruct the exact state of any decision, project, or system at any point in history. Query "why was this architecture chosen in Q3" and get a full evidence chain.

**Institutional Risk Forecasting** — continuously monitors the knowledge graph for early warning signals: knowledge silos, repeated failure patterns, architectural drift, team fragmentation, and roadmap contradictions. Scores each risk and routes alerts.

**Expertise Gravity Mapping** — builds a dynamic map of who knows what, accounting for tenure, contribution patterns, and cross-team influence. Identifies single points of failure in knowledge distribution.

**Decision DNA Engine** — extracts every significant decision from every artifact, links it to its evidence, tracks its outcome over time, and surfaces decisions that contradict each other before they cause production incidents.

**Persistent Organizational Memory** — embeddings stored in Pinecone alongside the graph in Neo4j give every query semantic retrieval. The organization never forgets.

**Organizational Simulation Engine** — model counterfactuals. Given a proposed architectural change, simulate likely outcomes based on historical decision patterns and confidence-scored probability distributions.

**Autonomous Watchtower** — a continuous monitoring agent built on Google ADK runs every 60 minutes, scans for anomalies across all services, and fires alerts without human intervention.

**Organizational Consciousness Score** — a composite metric (0-100) measuring six dimensions: knowledge coherence, decision consistency, expertise distribution, memory completeness, learning velocity, and risk awareness. Tracked over time in BigQuery.

## Architecture

Nine stateless Cloud Run services communicate over Google Cloud Pub/Sub:

| Service | Responsibility |
|---|---|
| nexusdrift-api | FastAPI REST gateway, webhook receiver |
| nexusdrift-ingestion | Polls GitHub, Jira, Slack; publishes raw artifacts |
| nexusdrift-parser | Gemini 2.5 Flash entity and decision extraction |
| nexusdrift-graph-writer | Neo4j node and edge writer |
| nexusdrift-reasoning | LangGraph contradiction detection and risk scoring |
| nexusdrift-simulation | Vertex AI probabilistic outcome modeling |
| nexusdrift-watchtower | Google ADK continuous 60-minute monitoring loop |
| nexusdrift-scorer | Computes Organizational Consciousness Score |
| nexusdrift-mcp-server | FastMCP graph tool exposure over SSE |

The frontend is a Next.js 15 application deployed on Vercel.

## Tech Stack

- **Runtime**: Python 3.11, Google Cloud Run
- **AI**: Gemini 2.5 Flash, Vertex AI, LangGraph, Google ADK
- **Graph**: Neo4j Aura, Pinecone (vector embeddings)
- **Storage**: Google Firestore, BigQuery
- **Messaging**: Google Cloud Pub/Sub
- **Auth**: Clerk
- **Frontend**: Next.js 15, deployed on Vercel
- **IaC**: Terraform
- **CI/CD**: Google Cloud Build + GitHub Actions

## Setup

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- Google Cloud SDK authenticated
- Neo4j Aura instance
- Pinecone account

### Local Development

```bash
# Clone the repository
git clone https://github.com/Yusra-Shah/Nexus-Drift.git
cd Nexus-Drift

# Copy environment variables
cp .env.example .env
# Fill in all required values in .env

# Start local services
make dev

# In a separate terminal, initialize Neo4j schema
make neo4j-schema

# Optionally seed demo data
make seed
```

### Running Tests

```bash
make test
```

### Linting

```bash
make lint
```

### Deploying to Google Cloud Run

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Apply infrastructure
cd infrastructure/terraform
terraform init
terraform apply

# Build and deploy all services
make deploy-all
```

## Project Structure

```
NexusDrift/
├── services/          # Nine independent Cloud Run services
├── frontend/          # Next.js 15 application
├── shared/            # Shared Pydantic models, graph clients, utilities
├── infrastructure/    # Terraform (GCP) and Cloud Build configs
├── scripts/           # One-off operational scripts
└── docs/              # Architecture diagrams and API documentation
```

## License

MIT
