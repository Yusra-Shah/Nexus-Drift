# Firestore database in native mode.
# Collections are created automatically on first write; they cannot be declared in Terraform.
# Expected collections:
#   - agent_state       : current execution state of each agent
#   - alerts            : alert queue with severity and acknowledged fields
#   - simulations       : simulation job queue and results
#   - user_preferences  : per-user dashboard and notification preferences
#   - processing_queue  : artifact IDs awaiting ingestion

resource "google_firestore_database" "nexusdrift" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.apis]
}
