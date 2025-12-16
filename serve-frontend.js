import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve admin panel specifically
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'admin', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend server running on http://localhost:${PORT}`);
    console.log(`📝 Admin panel: http://localhost:${PORT}/assets/admin/admin.html`);
    console.log(`📝 Or directly: http://localhost:${PORT}/admin`);
    console.log(`🧪 Test page: http://localhost:${PORT}/test-admin-local.html`);
    console.log(`🏠 Main site: http://localhost:${PORT}/index.html`);
    console.log('');
    console.log('💡 Make sure the API server is also running on port 3002');
});