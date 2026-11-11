import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'database.json');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vps-persistent-json-db',
      configureServer(server) {
        server.middlewares.use('/api/db', (req, res) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (req.method === 'GET') {
            try {
              if (fs.existsSync(DB_FILE)) {
                const raw = fs.readFileSync(DB_FILE, 'utf-8');
                res.statusCode = 200;
                res.end(raw);
                return;
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ empty: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                if (!fs.existsSync(DB_DIR)) {
                  fs.mkdirSync(DB_DIR, { recursive: true });
                }
                // Validate JSON before saving
                JSON.parse(body);
                fs.writeFileSync(DB_FILE, body, 'utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(err) }));
              }
            });
          } else if (req.method === 'DELETE') {
            try {
              if (fs.existsSync(DB_FILE)) {
                fs.unlinkSync(DB_FILE);
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          } else {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
