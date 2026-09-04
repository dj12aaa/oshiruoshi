#!/usr/bin/env bash
set -euo pipefail

base="${1:-https://oshiruoshi.vercel.app}"
target_dir="${2:?temporary output directory is required}"
attempts="${3:-36}"
ready=0

valid_sitemap(){
  node - "$1" <<'NODE'
const fs=require('fs');
const xml=fs.readFileSync(process.argv[2],'utf8');
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
if(urls.length!==21||new Set(urls).size!==21)process.exit(1);
if(!urls.every(url=>url.startsWith('https://oshiruoshi.vercel.app/')))process.exit(1);
NODE
}

for attempt in $(seq 1 "$attempts"); do
  nonce="${GITHUB_SHA:-local}-$attempt-$(date +%s)"
  if curl --connect-timeout 5 --max-time 12 --fail --silent --show-error --location "$base/robots.txt?v=$nonce" -o "$target_dir/robots.txt" \
    && grep -Fq 'Sitemap: https://oshiruoshi.vercel.app/sitemap.xml' "$target_dir/robots.txt" \
    && grep -Fq 'Disallow: /*?q=' "$target_dir/robots.txt" \
    && curl --connect-timeout 5 --max-time 12 --fail --silent --show-error --location "$base/sitemap.xml?v=$nonce" -o "$target_dir/sitemap.xml" \
    && valid_sitemap "$target_dir/sitemap.xml" \
    && grep -Fq '<loc>https://oshiruoshi.vercel.app/character/gojo-satoru</loc>' "$target_dir/sitemap.xml" \
    && grep -Fq '<lastmod>2026-09-05</lastmod>' "$target_dir/sitemap.xml" \
    && curl --connect-timeout 5 --max-time 12 --fail --silent --show-error --location "$base/character/gojo-satoru?v=$nonce" -o "$target_dir/seo.html" \
    && grep -Fq 'oshiru-seo-version" content="2026-09-05.18' "$target_dir/seo.html" \
    && grep -Fq 'application/ld+json" data-oshiru-structured' "$target_dir/seo.html"; then
    ready=1
    break
  fi
  sleep 5
done

test "$ready" = 1
echo 'Production robots, sitemap and server-rendered SEO are ready.'
