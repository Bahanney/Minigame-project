# ════════════════════════════════════════════════
# VENOM — Dockerfile
# Serves the game via nginx in a lightweight container
# Author: Ibinabo Collins
# ════════════════════════════════════════════════

# Use official nginx alpine image — lightweight (~23MB)
FROM nginx:alpine

# Copy game files into nginx's default web root
COPY index.html  /usr/share/nginx/html/index.html
COPY style.css   /usr/share/nginx/html/style.css
COPY game.js     /usr/share/nginx/html/game.js
COPY assets/     /usr/share/nginx/html/assets/

# Expose port 80 for web traffic
EXPOSE 80

# nginx starts automatically — no CMD needed