# SupplyChain AI agent-service — Strands Agents on FastAPI.
# Same image runs on Cloud Run (amd64) and Bedrock AgentCore Runtime (arm64): build with --platform as needed.
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock* ./
RUN uv export --no-dev --extra memory --format requirements-txt -o requirements.txt 2>/dev/null \
  || uv pip compile pyproject.toml --extra memory -o requirements.txt
RUN uv pip install --system --no-cache -r requirements.txt
COPY . .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8080/ping')" || exit 1
CMD ["python", "app.py"]
