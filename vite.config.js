import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

// Plugin to serve project-root /Fuentes as static files
function serveFuentesPlugin() {
    const fuentesDir = path.resolve(__dirname, 'Fuentes');
    return {
        name: 'serve-fuentes',
        configureServer(server) {
            server.middlewares.use('/Fuentes', (req, res, next) => {
                const filePath = path.join(fuentesDir, decodeURIComponent(req.url.split('?')[0]));
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    // Cache static data files for 5 minutes to avoid re-downloads
                    res.setHeader('Cache-Control', 'public, max-age=300');
                    fs.createReadStream(filePath).pipe(res);
                } else {
                    next();
                }
            });
        },
        // Copy Fuentes into dist during build
        closeBundle() {
            const distFuentes = path.resolve(__dirname, 'dist', 'Fuentes');
            if (fs.existsSync(fuentesDir)) {
                fs.cpSync(fuentesDir, distFuentes, { recursive: true });
                console.log(`[serve-fuentes] Recursively copied Fuentes to dist/Fuentes`);
            }
        }
    };
}

export default defineConfig({
    plugins: [serveFuentesPlugin()],
    server: {
        proxy: {
            '/sofia-api': {
                target: 'http://apisofia.sofiagestionagricola.cl',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/sofia-api/, '')
            },
            '/api': {
                target: 'http://localhost:10000',
                changeOrigin: true
            }
        }
    },
    build: {
        // Optimize chunk splitting for faster loads
        rollupOptions: {
            output: {
                manualChunks: {
                    'chart': ['chart.js', 'chartjs-plugin-datalabels'],
                    'xlsx': ['xlsx'],
                    'vendor': ['papaparse']
                }
            }
        },
        // Increase chunk size warning limit (our Views.js is large by design)
        chunkSizeWarningLimit: 500
    },
    preview: {
        allowedHosts: ['proyectonatura.onrender.com']
    }
})
