#!/bin/bash

#
# Script de déploiement générique pour applications statiques (Node)
# --------------------------------------------------------------
# Objectif: cloner ou mettre à jour un dépôt Git dans un dossier cible,
# installer les dépendances via npm, compiler le bundle JS, puis ajuster
# les permissions. Aucune dépendance PHP/Composer requise.
#
# Utilisation (exemples):
#   ./deploy.sh \
#       --repo git@github.com:org/projet.git \
#       --dir /var/www/org/projet \
#       --branch main \
#       --owner deploy:www-data
#
#   ./deploy.sh -r git@github.com:org/projet.git -d /var/www/projet -b main
#
# Paramètres:
#   -r, --repo <url>           URL du dépôt Git (obligatoire)
#   -d, --dir <path>           Dossier de déploiement absolu (obligatoire)
#   -b, --branch <name>        Branche à déployer (défaut: main)
#   -o, --owner <user:group>   Propriétaire:group pour chown (défaut: deploy:www-data)
#       --npm <path>           Binaire npm (défaut: npm)
#       --no-install            Ne pas exécuter npm ci
#       --no-build              Ne pas exécuter npm run build
#       --allowed-repo <url>   Restreindre au dépôt exact (sécurité optionnelle)
#       --ssh-key-file <path>  Chemin d'une clé privée SSH à utiliser pour git (optionnel)
#       --ssh-key-content <s>  Contenu de la clé privée SSH (multiligne). Le script créera un fichier temporaire sécurisé
#   -h, --help                 Affiche cette aide
#
# Exigences:
#   - bash, git, Node.js/npm disponibles sur la machine cible
#   - Accès au dépôt (SSH ou HTTPS) configuré
#
# Notes:
#   - Le script est idempotent: il clone si nécessaire, sinon fait un fetch/reset
#   - public/ est servi statiquement par nginx, aucun rechargement de service n'est requis
#

set -Eeuo pipefail
umask 0002

# Valeurs par défaut
REPO_URL=""
DEPLOY_DIR=""
BRANCH="main"
OWNER_GROUP="deploy:deploy"
NPM_BIN="npm"
RUN_INSTALL=1
RUN_BUILD=1
ALLOWED_REPO=""
# SSH
SSH_KEY_FILE=""
SSH_KEY_CONTENT=""

usage() {
    sed -n '1,80p' "$0" | sed -n '2,80p' | sed '/^set -Eeuo pipefail/q'
    echo
    echo "Exemples rapides :"
    echo "  $0 -r git@github.com:org/projet.git -d /var/www/projet -b main -o www-data:www-data"
    echo "  $0 --repo https://github.com/org/projet.git --dir /srv/projet --no-build"
}

# Parsing des arguments (long + courts)
if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        -r|--repo)
            REPO_URL="${2:-}"; shift 2 ;;
        -d|--dir)
            DEPLOY_DIR="${2:-}"; shift 2 ;;
        -b|--branch)
            BRANCH="${2:-}"; shift 2 ;;
        -o|--owner)
            OWNER_GROUP="${2:-}"; shift 2 ;;
        --npm)
            NPM_BIN="${2:-}"; shift 2 ;;
        --no-install)
            RUN_INSTALL=0; shift ;;
        --no-build)
            RUN_BUILD=0; shift ;;
        --allowed-repo)
            ALLOWED_REPO="${2:-}"; shift 2 ;;
        --ssh-key-file)
            SSH_KEY_FILE="${2:-}"; shift 2 ;;
        --ssh-key-content)
            SSH_KEY_CONTENT="${2:-}"; shift 2 ;;
        -h|--help)
            usage; exit 0 ;;
        *)
            echo "❌ Option inconnue: $1" >&2
            echo
            usage
            exit 1 ;;
    esac
done

# Validation des paramètres requis
if [[ -z "$REPO_URL" || -z "$DEPLOY_DIR" ]]; then
    echo "❌ Paramètres manquants: --repo et --dir sont obligatoires" >&2
    echo
    usage
    exit 1
fi

# Sécurité optionnelle: dépôt autorisé
if [[ -n "$ALLOWED_REPO" && "$REPO_URL" != "$ALLOWED_REPO" ]]; then
    echo "❌ Dépôt non autorisé. Autorisé: $ALLOWED_REPO" >&2
    exit 1
fi

# Garde-fou sur DEPLOY_DIR
if [[ "$DEPLOY_DIR" == "/" || -z "$DEPLOY_DIR" ]]; then
    echo "❌ Dossier de déploiement invalide: $DEPLOY_DIR" >&2
    exit 1
fi
if [[ ! "$DEPLOY_DIR" =~ ^/ ]]; then
    echo "❌ --dir doit être un chemin absolu" >&2
    exit 1
fi

OWNER_USER="${OWNER_GROUP%%:*}"
OWNER_GR="${OWNER_GROUP##*:}"

echo "🚀 Début du déploiement sur $DEPLOY_DIR (branche: $BRANCH)"

mkdir -p "$DEPLOY_DIR"

# Configuration dynamique de la clé SSH si fournie
TMP_SSH_KEY=""
if [[ -n "$SSH_KEY_CONTENT" ]]; then
    # Crée un fichier temporaire pour la clé
    TMP_SSH_KEY=$(mktemp -p "${TMPDIR:-/tmp}" deploy_ssh_key.XXXXXX)
    # Forcer permissions restreintes
    PREV_UMASK=$(umask)
    umask 077
    printf "%s\n" "$SSH_KEY_CONTENT" > "$TMP_SSH_KEY"
    umask "$PREV_UMASK"
    chmod 600 "$TMP_SSH_KEY" 2>/dev/null || true
    SSH_KEY_FILE="$TMP_SSH_KEY"
    # Nettoyage à la fin
    trap 'if [[ -n "$TMP_SSH_KEY" && -f "$TMP_SSH_KEY" ]]; then rm -f "$TMP_SSH_KEY"; fi' EXIT
fi

if [[ -n "$SSH_KEY_FILE" ]]; then
    # Assure permissions correctes
    chmod 600 "$SSH_KEY_FILE" 2>/dev/null || true
    export GIT_SSH_COMMAND="ssh -i '$SSH_KEY_FILE' -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
fi

if [ ! -d "$DEPLOY_DIR/.git" ]; then
    echo "📥 Premier déploiement - Clone du repository..."

    # Si le dossier existe mais n'est pas un repo git
    if [ -d "$DEPLOY_DIR" ] && [ -n "$(ls -A "$DEPLOY_DIR" 2>/dev/null || true)" ]; then
        echo "❌ Le dossier $DEPLOY_DIR n'est pas vide et n'est pas un repo Git."
        exit 1
    fi

    git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"

    setfacl -R -m u:"$OWNER_USER":rwx -m g:"$OWNER_GR":rwx . 2>/dev/null || true
    setfacl -R -d -m u:"$OWNER_USER":rwx -m g:"$OWNER_GR":rwx . 2>/dev/null || true

else
    echo "🔄 Mise à jour du code..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
fi

if [[ $RUN_INSTALL -eq 1 ]]; then
    echo "📦 Installation des dépendances (npm)..."
    if ! command -v "$NPM_BIN" >/dev/null 2>&1; then
        echo "❌ npm est introuvable (binaire: $NPM_BIN)." >&2
        exit 1
    fi

    "$NPM_BIN" ci
else
    echo "⏭️  Étape install ignorée (--no-install)"
fi

if [[ $RUN_BUILD -eq 1 ]]; then
    echo "🎨 Compilation du bundle..."
    "$NPM_BIN" run build
else
    echo "⏭️  Étape build ignorée (--no-build)"
fi

echo "🔐 Configuration des permissions..."
chgrp -R "$OWNER_GR" "$DEPLOY_DIR" 2>/dev/null || true
chmod -R g+rX "$DEPLOY_DIR/public" 2>/dev/null || true

echo "📌 Révision déployée: $(git rev-parse --short HEAD 2>/dev/null || echo 'inconnue')"

echo "✅ Déploiement terminé avec succès !"
