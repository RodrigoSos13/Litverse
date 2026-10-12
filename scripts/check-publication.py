#!/usr/bin/env python3
"""Audita arquivos publicáveis e histórico sem imprimir possíveis segredos."""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

PATTERNS = {
    "chave privada": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"),
    "token GitHub": re.compile(rb"(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})"),
    "chave AWS": re.compile(rb"(?:AKIA|ASIA)[A-Z0-9]{16}"),
    "token OpenAI": re.compile(rb"sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}"),
    "token Slack": re.compile(rb"xox[baprs]-[A-Za-z0-9-]{20,}"),
    "credencial em URL MongoDB": re.compile(rb"mongodb(?:\+srv)?://[^\s/'\"<>]+:[^\s/'\"<>]+@"),
}
findings = set()

def check(path, content, location):
    parts = pathlib.PurePosixPath(path).parts
    name = parts[-1] if parts else ""
    environment = (name == ".env" or name.startswith(".env.")) and not name.endswith(".example")
    credentials = name.endswith((".pem", ".key", ".p12", ".pfx")) or name == "credentials.json" or name.startswith("service-account")
    local_data = any(part.startswith(".mongodb-data") or part in (".aws", ".ssh", "dump", "dumps", "backups", "node_modules", ".codex") for part in parts)
    if environment or credentials or local_data:
        findings.add((location, path, "arquivo local ou sensível"))
    for label, pattern in PATTERNS.items():
        if pattern.search(content):
            findings.add((location, path, label))

# Inspeciona índice e alterações locais que seriam incluídas por git add.
index_paths = git("ls-files", "-z").split(b"\0")
for encoded in index_paths:
    if not encoded:
        continue
    path = encoded.decode("utf-8", "surrogateescape")
    check(path, git("show", f":{path}"), "índice")
paths = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split(b"\0")
for encoded in set(paths):
    if not encoded:
        continue
    path = encoded.decode("utf-8", "surrogateescape")
    file = ROOT / path
    if file.is_file():
        check(path, file.read_bytes(), "arquivos atuais")

# Segredos apagados continuam publicáveis no histórico; verifica todos os refs locais.
seen = set()
commits = git("rev-list", "--all").splitlines()
for commit in commits:
    commit = commit.decode("ascii")
    for entry in git("ls-tree", "-r", "-z", commit).split(b"\0"):
        if not entry:
            continue
        metadata, encoded = entry.split(b"\t", 1)
        _, kind, oid = metadata.split()
        if kind != b"blob":
            continue
        path = encoded.decode("utf-8", "surrogateescape")
        key = (oid, path)
        if key in seen:
            continue
        seen.add(key)
        check(path, git("cat-file", "blob", oid.decode("ascii")), f"histórico {commit[:8]}")

if findings:
    for location, path, reason in sorted(findings):
        print(f"REVISAR: {location}: {path} ({reason})")
    print("Não publique antes de revisar os itens acima. Nenhum valor sensível foi exibido.")
    sys.exit(1)
print(f"Verificação concluída: índice, arquivos publicáveis e {len(commits)} commits; nenhum indício nos padrões verificados.")
print("A verificação é heurística: revise também o diff antes de publicar.")
