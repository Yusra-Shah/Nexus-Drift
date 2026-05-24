resource "google_pubsub_topic" "raw_artifacts_dead" {
  name    = "nexusdrift-raw-artifacts-dead"
  project = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "raw_artifacts" {
  name    = "nexusdrift-raw-artifacts"
  project = var.project_id

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.raw_artifacts_dead.id
    max_delivery_attempts = 5
  }

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "parsed_entities" {
  name    = "nexusdrift-parsed-entities"
  project = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "graph_updates" {
  name    = "nexusdrift-graph-updates"
  project = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_pubsub_topic" "alerts" {
  name    = "nexusdrift-alerts"
  project = var.project_id

  depends_on = [google_project_service.apis]
}
