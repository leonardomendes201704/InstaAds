#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "Defina RUNNER_TOKEN com o token de registro do GitHub Actions."
  exit 1
fi

RUNNER_USER="${RUNNER_USER:-github-runner}"
RUNNER_VERSION="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | python3 -c 'import sys, json; print(json.load(sys.stdin)["tag_name"])')"
RUNNER_DIR="/opt/actions-runner"

if ! id "${RUNNER_USER}" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "${RUNNER_USER}"
fi

usermod -aG docker "${RUNNER_USER}" 2>/dev/null || true

echo "Instalando runner ${RUNNER_VERSION} em ${RUNNER_DIR} ..."

mkdir -p "${RUNNER_DIR}"
chown -R "${RUNNER_USER}:${RUNNER_USER}" "${RUNNER_DIR}"

install_runner() {
  cd "${RUNNER_DIR}"

  if [[ ! -f ./config.sh ]]; then
    curl -fsSL -o actions-runner.tar.gz -L \
      "https://github.com/actions/runner/releases/download/${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION#v}.tar.gz"
    tar xzf actions-runner.tar.gz
    rm actions-runner.tar.gz
  fi

  if [[ ! -f .runner ]]; then
    ./config.sh \
      --url "https://github.com/leonardomendes201704/InstaAds" \
      --token "${RUNNER_TOKEN}" \
      --name "vps-instaads" \
      --labels "self-hosted,linux,instaads" \
      --unattended \
      --replace
  fi
}

if [[ "$(id -u)" -eq 0 ]]; then
  sudo -u "${RUNNER_USER}" RUNNER_TOKEN="${RUNNER_TOKEN}" RUNNER_DIR="${RUNNER_DIR}" bash -c "$(declare -f install_runner); install_runner"
  cd "${RUNNER_DIR}"
  ./svc.sh install 2>/dev/null || true
  ./svc.sh start
  ./svc.sh status
else
  install_runner
fi

echo "Runner instalado."
