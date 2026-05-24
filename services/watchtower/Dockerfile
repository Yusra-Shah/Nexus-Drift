FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ../../shared /app/shared
COPY . /app/services/watchtower

WORKDIR /app/services/watchtower

ENV PYTHONPATH="/app:/app/services/watchtower"

CMD ["python", "main.py"]
