.PHONY: dev build-all deploy-all test lint neo4j-schema seed

PROJECT_ID ?= $(shell grep GOOGLE_CLOUD_PROJECT .env | cut -d= -f2)
REGION ?= us-central1
REGISTRY ?= $(REGION)-docker.pkg.dev/$(PROJECT_ID)/nexusdrift

dev:
	docker-compose up --build

build-all:
	docker build -t $(REGISTRY)/api:latest services/api
	docker build -t $(REGISTRY)/ingestion:latest services/ingestion
	docker build -t $(REGISTRY)/parser:latest services/parser
	docker build -t $(REGISTRY)/graph-writer:latest services/graph-writer
	docker build -t $(REGISTRY)/reasoning:latest services/reasoning
	docker build -t $(REGISTRY)/simulation:latest services/simulation
	docker build -t $(REGISTRY)/watchtower:latest services/watchtower
	docker build -t $(REGISTRY)/scorer:latest services/scorer
	docker build -t $(REGISTRY)/mcp-server:latest services/mcp-server

deploy-all:
	gcloud run deploy nexusdrift-api --image $(REGISTRY)/api:latest --region $(REGION) --platform managed --allow-unauthenticated
	gcloud run deploy nexusdrift-ingestion --image $(REGISTRY)/ingestion:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-parser --image $(REGISTRY)/parser:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-graph-writer --image $(REGISTRY)/graph-writer:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-reasoning --image $(REGISTRY)/reasoning:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-simulation --image $(REGISTRY)/simulation:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-watchtower --image $(REGISTRY)/watchtower:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-scorer --image $(REGISTRY)/scorer:latest --region $(REGION) --platform managed
	gcloud run deploy nexusdrift-mcp-server --image $(REGISTRY)/mcp-server:latest --region $(REGION) --platform managed

test:
	python -m pytest services/ --tb=short -q

lint:
	ruff check services/ shared/

neo4j-schema:
	python scripts/init_neo4j.py

seed:
	python scripts/seed_data.py
