import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirPath = path.join(__dirname, 'public/Fuentes/Presupuestos');
const filePath = path.join(dirPath, 'test_write.json');

try {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('Created dir');
    }
    fs.writeFileSync(filePath, JSON.stringify({ success: true }), 'utf8');
    console.log('Success writing to ' + filePath);
    fs.unlinkSync(filePath);
} catch (e) {
    console.error('Failed to write: ' + e.message);
}
