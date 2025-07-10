location /api/ollama {
    proxy_pass http://10.74.18.69:11434/api/generate;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}