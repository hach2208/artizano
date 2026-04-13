#!/bin/bash
set -e

echo ""
echo "============================================"
echo "  MapLeads France — Installation automatique"
echo "============================================"
echo ""

# 1. Node.js
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js non trouvé."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install node
  elif [[ -f /etc/debian_version ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    echo "👉 Installe Node.js manuellement : https://nodejs.org (LTS)"
    exit 1
  fi
fi
echo "✅ Node.js $(node -v) détecté"

# 2. Dossier
INSTALL_DIR="$HOME/mapleads"
if [ -d "$INSTALL_DIR" ]; then
  echo "📁 Dossier déjà existant — mise à jour..."
  cd "$INSTALL_DIR"
  git pull 2>/dev/null || true
else
  echo "📦 Clonage du projet..."
  git clone -b claude/mapleads-reviews-analyzer-WvTMs https://github.com/hach2208/artizano.git "$HOME/artizano_tmp"
  mv "$HOME/artizano_tmp/mapleads" "$INSTALL_DIR"
  rm -rf "$HOME/artizano_tmp"
  cd "$INSTALL_DIR"
fi

# 3. .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "🔑 Entre ta clé Anthropic (claude.ai):"
  read -p "> " ANTHROPIC_KEY
  echo ""
  echo "🔑 Entre ta clé Google Places API:"
  read -p "> " GOOGLE_KEY
  sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_KEY|" .env
  sed -i "s|GOOGLE_PLACES_API_KEY=.*|GOOGLE_PLACES_API_KEY=$GOOGLE_KEY|" .env
  echo "✅ .env configuré"
else
  echo "✅ .env déjà présent"
fi

# 4. npm install
echo "📦 Installation des dépendances..."
npm install --silent
echo "✅ Prêt"

# 5. Lancement
echo ""
echo "  ➡️  Ouvre : http://localhost:3000"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
  sleep 2 && open http://localhost:3000 &
elif command -v xdg-open &> /dev/null; then
  sleep 2 && xdg-open http://localhost:3000 &
fi
node server.js
