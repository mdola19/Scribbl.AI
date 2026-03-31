# Optional convenience targets (requires Make + Docker).
.PHONY: local up down logs model

local:
	node scripts/local-up.mjs

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

model:
	docker compose exec ollama ollama pull llama3.2-vision
