resource "google_bigquery_dataset" "analytics" {
  dataset_id  = "nexusdrift_analytics"
  project     = var.project_id
  location    = var.region
  description = "Nexus Drift analytics: agent executions and consciousness scores"

  depends_on = [google_project_service.apis]
}

resource "google_bigquery_table" "agent_executions" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "agent_executions"
  project    = var.project_id

  schema = jsonencode([
    { name = "agent_id",             type = "STRING",    mode = "REQUIRED" },
    { name = "agent_name",           type = "STRING",    mode = "REQUIRED" },
    { name = "execution_type",       type = "STRING",    mode = "NULLABLE" },
    { name = "started_at",           type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "completed_at",         type = "TIMESTAMP", mode = "NULLABLE" },
    { name = "status",               type = "STRING",    mode = "REQUIRED" },
    { name = "input_artifact_count", type = "INT64",     mode = "NULLABLE" },
    { name = "output_node_count",    type = "INT64",     mode = "NULLABLE" },
    { name = "error_message",        type = "STRING",    mode = "NULLABLE" },
    { name = "trace_id",             type = "STRING",    mode = "NULLABLE" },
  ])

  time_partitioning {
    type  = "DAY"
    field = "started_at"
  }
}

resource "google_bigquery_table" "consciousness_scores" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "consciousness_scores"
  project    = var.project_id

  schema = jsonencode([
    { name = "org_id",                 type = "STRING",    mode = "REQUIRED" },
    { name = "score",                  type = "FLOAT64",   mode = "REQUIRED" },
    { name = "knowledge_coherence",    type = "FLOAT64",   mode = "NULLABLE" },
    { name = "decision_consistency",   type = "FLOAT64",   mode = "NULLABLE" },
    { name = "expertise_distribution", type = "FLOAT64",   mode = "NULLABLE" },
    { name = "memory_completeness",    type = "FLOAT64",   mode = "NULLABLE" },
    { name = "learning_velocity",      type = "FLOAT64",   mode = "NULLABLE" },
    { name = "risk_awareness",         type = "FLOAT64",   mode = "NULLABLE" },
    { name = "recorded_at",            type = "TIMESTAMP", mode = "REQUIRED" },
  ])

  time_partitioning {
    type  = "DAY"
    field = "recorded_at"
  }
}
