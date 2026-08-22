#!/bin/bash
# install-version-hook.sh
#
# Registra bump-version.js como hook pre-commit en el repositorio actual.
# Corre este script UNA SOLA VEZ en cada repo (front y back).
#
# Uso:
#   cd /ruta/al/repo
#   bash scripts/install-version-hook.sh

set -e

HOOK_FILE=".git/hooks/pre-commit"
BUMP_SCRIPT="scripts/bump-version.js"

# Verificar que estamos en la raíz de un repo git
if [ ! -d ".git" ]; then
  echo "❌  No se encontró .git en el directorio actual."
  echo "    Corre este script desde la raíz del repositorio."
  exit 1
fi

# Verificar que bump-version.js existe
if [ ! -f "$BUMP_SCRIPT" ]; then
  echo "❌  No se encontró $BUMP_SCRIPT"
  echo "    Asegúrate de copiar scripts/bump-version.js a este repo primero."
  exit 1
fi

# Advertir si ya existe un pre-commit hook
if [ -f "$HOOK_FILE" ]; then
  echo "⚠️   Ya existe un hook en $HOOK_FILE"
  read -r -p "    ¿Sobreescribir? (s/N): " confirm
  if [[ ! "$confirm" =~ ^[sS]$ ]]; then
    echo "    Instalación cancelada."
    exit 0
  fi
fi

# Crear el hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# Auto-generado por install-version-hook.sh
node "$(git rev-parse --show-toplevel)/scripts/bump-version.js"
EOF

chmod +x "$HOOK_FILE"
chmod +x "$BUMP_SCRIPT"

echo ""
echo "✅  Hook pre-commit instalado correctamente."
echo "    Cada 'git commit' te preguntará el tipo de cambio antes de proceder."
echo ""
