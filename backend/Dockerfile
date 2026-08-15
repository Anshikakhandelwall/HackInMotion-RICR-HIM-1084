FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for psycopg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.tx[t] backend/requirements.tx[t] ./
RUN if [ -f backend/requirements.txt ]; then mv backend/requirements.txt ./requirements.txt; fi
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./tmp_context
RUN if [ -d tmp_context/backend ]; then cp -r tmp_context/backend/* ./; else cp -r tmp_context/* ./; fi && rm -rf tmp_context

RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
