.PHONY: setup dev dev-api dev-web dev-gateway dev-moderation docker-up docker-down test clean

setup:
	@echo "Setting up development environment..."
	python3 -m pip install -r services/api/requirements.txt
	python3 -m pip install -r services/moderation/requirements.txt
	python3 -m pip install -r services/media-gateway/requirements.txt
	cd apps/web && npm install
	cd apps/twitch-extension && npm install

docker-up:
	docker compose up -d postgres redis livekit

docker-down:
	docker compose down

dev-api:
	cd services/api && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

dev-moderation:
	cd services/moderation && uvicorn api:app --host 0.0.0.0 --port 8001 --reload

dev-gateway:
	cd services/media-gateway && python3 gateway.py

dev-web:
	cd apps/web && npm run dev

dev-ext:
	cd apps/twitch-extension && npm run dev

test:
	pytest tests/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
