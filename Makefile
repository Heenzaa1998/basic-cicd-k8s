.PHONY: help install lint typecheck build test dev-api dev-worker \
       docker-build docker-up docker-down \
       helm-lint helm-template helm-install helm-upgrade helm-uninstall \
       clean

# ─── Variables ───────────────────────────────────────────────
RELEASE    ?= myapp
NAMESPACE  ?= default
VALUES     ?= helm/values.yaml
ENV_FILE   ?= dev

# ─── Help ────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ─────────────────────────────────────────────
install: ## Install all dependencies
	npm install

lint: ## Run ESLint
	npm run lint

typecheck: ## Run TypeScript type checking
	npm run typecheck

build: ## Build all services
	npm run build

test: ## Run unit tests
	npm test

dev-api: ## Start API in dev mode
	npm run dev:api

dev-worker: ## Start Worker in dev mode
	npm run dev:worker

# ─── Docker ──────────────────────────────────────────────────
docker-build: ## Build Docker images
	docker compose build

docker-up: ## Start all services with Docker Compose (ENV_FILE=dev|uat|prod)
	ENV_FILE=$(ENV_FILE) docker compose up --build

docker-down: ## Stop Docker Compose services
	docker compose down

# ─── Helm / Kubernetes ───────────────────────────────────────
helm-lint: ## Lint Helm chart
	helm lint helm/

helm-template: ## Render Helm templates (dry-run)
	helm template $(RELEASE) helm/ -f $(VALUES)

helm-install: ## Install Helm release (RELEASE=myapp VALUES=helm/values.yaml)
	helm install $(RELEASE) helm/ -f $(VALUES) -n $(NAMESPACE)

helm-upgrade: ## Upgrade Helm release
	helm upgrade $(RELEASE) helm/ -f $(VALUES) -n $(NAMESPACE)

helm-uninstall: ## Uninstall Helm release
	helm uninstall $(RELEASE) -n $(NAMESPACE)

# ─── Cleanup ─────────────────────────────────────────────────
clean: ## Remove build artifacts and node_modules
	rm -rf services/api/dist services/worker/dist
	rm -rf node_modules services/api/node_modules services/worker/node_modules
