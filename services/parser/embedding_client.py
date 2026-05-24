from __future__ import annotations

import os

_MAX_TEXT_CHARS = 2048
_EMBEDDING_DIM = 768


class EmbeddingClient:
    def __init__(self) -> None:
        import vertexai
        from vertexai.language_models import TextEmbeddingModel

        project = os.environ["GOOGLE_CLOUD_PROJECT"]
        location = os.environ.get("VERTEX_AI_LOCATION", "us-central1")
        vertexai.init(project=project, location=location)
        self._model = TextEmbeddingModel.from_pretrained("text-embedding-004")

    async def embed_text(self, text: str) -> list[float]:
        from vertexai.language_models import TextEmbeddingInput

        if not text:
            return [0.0] * _EMBEDDING_DIM

        text = text[:_MAX_TEXT_CHARS]
        try:
            results = self._model.get_embeddings([TextEmbeddingInput(text, "RETRIEVAL_DOCUMENT")])
            return list(results[0].values)
        except Exception:
            return [0.0] * _EMBEDDING_DIM

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        from vertexai.language_models import TextEmbeddingInput

        if not texts:
            return []

        batch_size = 5
        results: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            inputs = [
                TextEmbeddingInput(t[:_MAX_TEXT_CHARS], "RETRIEVAL_DOCUMENT") for t in batch
            ]
            try:
                embeddings = self._model.get_embeddings(inputs)
                results.extend(list(e.values) for e in embeddings)
            except Exception:
                results.extend([0.0] * _EMBEDDING_DIM for _ in batch)

        return results
