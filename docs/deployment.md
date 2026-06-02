# Nexus Drift Deployment

## Built for Gemini XPRIZE Hackathon 2026

**Deployed:** 2026-06-02  
**GCP Project:** adk-codelab-2026  
**Region:** us-central1  

## Service URLs

| Service | URL |
|---|---|
| nexusdrift-api | https://nexusdrift-api-7wguxf7noq-uc.a.run.app |
| nexusdrift-ingestion | https://nexusdrift-ingestion-7wguxf7noq-uc.a.run.app |
| nexusdrift-parser | https://nexusdrift-parser-7wguxf7noq-uc.a.run.app |
| nexusdrift-graph-writer | https://nexusdrift-graph-writer-7wguxf7noq-uc.a.run.app |
| nexusdrift-reasoning | https://nexusdrift-reasoning-7wguxf7noq-uc.a.run.app |
| nexusdrift-watchtower | https://nexusdrift-watchtower-7wguxf7noq-uc.a.run.app |
| nexusdrift-scorer | https://nexusdrift-scorer-7wguxf7noq-uc.a.run.app |
| nexusdrift-mcp-server | https://nexusdrift-mcp-server-7wguxf7noq-uc.a.run.app |
| Frontend (Vercel) | https://nexusdrift.vercel.app *(run `vercel --prod` from frontend/ to deploy)* |

## Infrastructure

- **Knowledge Graph:** Neo4j Aura Free — `neo4j+s://a5301324.databases.neo4j.io` (database: `a5301324`)
- **Vector Index:** Pinecone (`nexusdrift-embeddings`, 768 dims, cosine)
- **Event Bus:** Google Cloud Pub/Sub (4 topics, 3 subscriptions)
- **Analytics:** BigQuery (`adk-codelab-2026:nexusdrift_analytics`)
- **Auth:** Clerk (publishable key: `pk_test_Y2Fyam...`)
- **Container Registry:** `us-central1-docker.pkg.dev/adk-codelab-2026/nexusdrift`

## Pub/Sub Topics and Subscriptions

| Topic | Subscription |
|---|---|
| nexusdrift-raw-artifacts | nexusdrift-raw-artifacts-parser-sub |
| nexusdrift-parsed-entities | nexusdrift-parsed-entities-writer-sub |
| nexusdrift-graph-updates | nexusdrift-graph-updates-reasoning-sub |
| nexusdrift-alerts | *(no subscription — push alerts via API)* |

## BigQuery Tables

- `nexusdrift_analytics.consciousness_scores` — scored every 15 minutes by nexusdrift-scorer
- `nexusdrift_analytics.agent_executions` — execution records from all agents

## Secret Manager Secrets

All secrets stored in `adk-codelab-2026` Secret Manager under names:
`nexusdrift-neo4j-uri`, `nexusdrift-neo4j-username`, `nexusdrift-neo4j-password`,
`nexusdrift-neo4j-database`, `nexusdrift-gemini-api-key`, `nexusdrift-pinecone-api-key`,
`nexusdrift-pinecone-index-name`, `nexusdrift-clerk-secret-key`, `nexusdrift-github-token`

## Seeded Demo Data (Neo4j)

| Node Type | Count |
|---|---|
| Person | 5 |
| Decision | 8 |
| Concept | 5 |
| Risk | 3 |
| Contradiction | 2 |

## Autonomous Operations

The system runs continuously without human intervention:

| Service | Schedule | Description |
|---|---|---|
| nexusdrift-ingestion | every 5 min | Polls GitHub/Jira/Slack for new artifacts |
| nexusdrift-parser | event-driven | Parses raw artifacts via Gemini, writes to Pub/Sub |
| nexusdrift-graph-writer | event-driven | Writes parsed entities to Neo4j + Pinecone |
| nexusdrift-reasoning | event-driven | Detects contradictions, forecasts risks |
| nexusdrift-watchtower | every 60 min | Generates monitoring alerts via Gemini |
| nexusdrift-scorer | every 15 min | Computes Organizational Consciousness Score |
| nexusdrift-mcp-server | always-on | MCP tool server for LLM graph access |

## Evidence of Autonomous AI Execution

- **Agent execution logs:** BigQuery → `nexusdrift_analytics.agent_executions`
- **Firestore collections:** `agent_state`, `alerts`, `consciousness_scores`, `ingestion_cursors`
- **API health:** `GET /api/health` → `{"status":"ok","dependencies":{"neo4j":"ok","firestore":"ok"}}`

## Frontend Deployment (Vercel)

The frontend requires interactive Vercel authentication. Run once:
```bash
cd frontend/
vercel login
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_API_URL production
# Set NEXT_PUBLIC_API_URL = https://nexusdrift-api-7wguxf7noq-uc.a.run.app
vercel --prod
```

## Known Issues and Resolutions

1. **UTF-8 BOM in secrets**: PowerShell 5.1 adds BOM to UTF-8 files by default.
   Fixed by using `New-Object System.Text.UTF8Encoding($false)` when writing temp files.

2. **Neo4j database name**: AuraDB Free instance uses instance ID (`a5301324`) as database name,
   not the default `neo4j`. Fixed in `NEO4J_DATABASE` env var and secret.

3. **Cloud Run health checks**: Pub/Sub subscriber services are long-running daemons without HTTP.
   Added `shared/utils/health_server.py` — a minimal HTTP health server started in a daemon thread
   before the main async loop, satisfying Cloud Run's PORT probe.
