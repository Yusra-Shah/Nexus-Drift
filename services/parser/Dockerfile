FROM python:3.11-slim
WORKDIR /app
COPY services/parser/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/parser/ /app/
COPY shared /app/shared
ENV PYTHONPATH=/app
CMD ["python", "main.py"]
