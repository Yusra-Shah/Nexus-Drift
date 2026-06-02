FROM python:3.11-slim
WORKDIR /app
COPY services/scorer/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/scorer/ /app/
COPY shared /app/shared
ENV PYTHONPATH=/app
CMD ["python", "main.py"]
