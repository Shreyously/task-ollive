#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Apply all k8s manifests in the correct order.
# Run from the project root: bash k8s/deploy.sh
# =============================================================================
set -euo pipefail

NAMESPACE="ollive"

# Colour helpers
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Use standalone kubectl if available, otherwise fall back to minikube kubectl.
if command -v kubectl &>/dev/null; then
  KUBECTL="kubectl"
elif command -v minikube &>/dev/null; then
  warn "kubectl not found — using 'minikube kubectl --' instead."
  KUBECTL="minikube kubectl --"
else
  error "Neither kubectl nor minikube found. Is your cluster running?"
fi

# Verify the cluster is reachable.
$KUBECTL cluster-info &>/dev/null || error "Cannot reach the cluster. Is minikube/k3s running?"

# ---- 1. Namespace ----
info "Creating namespace..."
$KUBECTL apply -f k8s/namespace.yaml

# ---- 2. Secrets & ConfigMap ----
info "Applying secrets and configmap..."
$KUBECTL apply -f k8s/secrets.yaml
$KUBECTL apply -f k8s/configmap.yaml

# ---- 3. Postgres ----
info "Deploying postgres..."
$KUBECTL apply -f k8s/postgres/
$KUBECTL -n $NAMESPACE rollout status deployment/postgres --timeout=120s

# ---- 4. Redis ----
info "Deploying redis..."
$KUBECTL apply -f k8s/redis/
$KUBECTL -n $NAMESPACE rollout status deployment/redis --timeout=120s

# ---- 5. Run migrations ----
info "Running Prisma migrations..."
# Delete any previous migrate job (Jobs are immutable on re-apply).
$KUBECTL -n $NAMESPACE delete job prisma-migrate --ignore-not-found
$KUBECTL apply -f k8s/jobs/migrate.yaml
$KUBECTL -n $NAMESPACE wait --for=condition=complete job/prisma-migrate --timeout=180s \
  || { $KUBECTL -n $NAMESPACE logs job/prisma-migrate; error "Migration failed!"; }
info "Migrations complete."

# ---- 6. API ----
info "Deploying api..."
$KUBECTL apply -f k8s/api/
$KUBECTL -n $NAMESPACE rollout status deployment/api --timeout=180s

# ---- 7. Worker ----
info "Deploying worker..."
$KUBECTL apply -f k8s/worker/
$KUBECTL -n $NAMESPACE rollout status deployment/worker --timeout=120s

# ---- 8. Frontend ----
info "Deploying frontend..."
$KUBECTL apply -f k8s/frontend/
$KUBECTL -n $NAMESPACE rollout status deployment/frontend --timeout=120s

# ---- Done ----
echo ""
info "All services deployed! ✓"
echo ""
echo "  Frontend : http://localhost:30080"
echo "  API      : http://localhost:30001"
echo "  Health   : http://localhost:30001/health"
echo ""
echo "Useful commands:"
echo "  $KUBECTL -n $NAMESPACE get pods"
echo "  $KUBECTL -n $NAMESPACE logs -f deploy/api"
echo "  $KUBECTL -n $NAMESPACE logs -f deploy/worker"
