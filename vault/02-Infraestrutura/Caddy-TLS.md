---
type: doc
area: infra
tags: [instaads, doc, caddy, tls]
updated: 2026-09-04
---

# Caddy e TLS

## Configuração

Arquivo: [`deploy/Caddyfile`](../../deploy/Caddyfile)

```
insta-ads.online, www.insta-ads.online {
	reverse_proxy app:3000
}
```

## Comportamento

- **TLS automático** via Let's Encrypt (Caddy gerencia certificados)
- Termina HTTPS nas portas **443** (e redireciona HTTP 80)
- Encaminha todo tráfego para o container `app:3000` na rede Docker interna

## Por que Caddy?

- Configuração mínima para HTTPS em VPS
- Renovação automática de certificados
- Não expõe o Next.js diretamente à internet

## Domínio e DNS

Registros DNS do domínio `insta-ads.online` devem apontar para o IP da VPS (A/AAAA records).

## `AUTH_URL`

Deve corresponder ao domínio público:

```env
AUTH_URL=https://insta-ads.online
```

Auth.js usa esta URL para callbacks OAuth e cookies seguros.

## Relacionado

- [[Docker-Compose]] — serviço `caddy`
- [[VPS-Hostinger]] — ambiente de produção
