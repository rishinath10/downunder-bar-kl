const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = 'downunder2026';
const ADMIN_TOKEN = 'admin-session-token-2026'; // Simple hardcoded token for demo auth

// Mime types helper
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to read JSON request body
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Endpoints ---

  // GET /api/data - Read database
  if (req.method === 'GET' && req.url === '/api/data') {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database file not found' }));
        return;
      }
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(rawData);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read database: ' + err.message }));
    }
    return;
  }

  // POST /api/data - Update database (requires token validation)
  if (req.method === 'POST' && req.url === '/api/data') {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized access' }));
        return;
      }

      const newData = await parseJsonBody(req);
      
      // Basic safety check: we want to preserve bookings if not provided
      if (fs.existsSync(DATA_FILE)) {
        const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (!newData.bookings && currentData.bookings) {
          newData.bookings = currentData.bookings;
        }
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Database updated successfully' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update database: ' + err.message }));
    }
    return;
  }

  // POST /api/login - Simple credentials match
  if (req.method === 'POST' && req.url === '/api/login') {
    try {
      const body = await parseJsonBody(req);
      if (body.password === ADMIN_PASSWORD) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Incorrect password' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Login error: ' + err.message }));
    }
    return;
  }

  // POST /api/booking - Front-end guest booking form (no authentication required)
  if (req.method === 'POST' && req.url === '/api/booking') {
    try {
      const booking = await parseJsonBody(req);
      if (!booking.name || !booking.email || !booking.phone || !booking.date || !booking.time || !booking.guests) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required booking fields' }));
        return;
      }

      if (!fs.existsSync(DATA_FILE)) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database does not exist' }));
        return;
      }

      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (!data.bookings) {
        data.bookings = [];
      }

      booking.id = Date.now();
      booking.status = 'Pending';
      data.bookings.unshift(booking); // Put new bookings first

      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Booking registered successfully', bookingId: booking.id }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Booking failed: ' + err.message }));
    }
    return;
  }

  // POST /api/upload - Base64 Image Upload (requires token validation)
  if (req.method === 'POST' && req.url === '/api/upload') {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized access' }));
        return;
      }

      const body = await parseJsonBody(req);
      if (!body.name || !body.data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing name or image data' }));
        return;
      }

      const fileName = body.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize filename
      const base64Data = body.data.split(';base64,').pop();
      
      const uploadDir = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, url: `/uploads/${fileName}` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image upload failed: ' + err.message }));
    }
    return;
  }

  // --- Static Files Serving ---
  let filePath = req.url;
  
  // Custom routing: redirect /admin or /admin/ to admin.html
  if (filePath === '/admin' || filePath === '/admin/') {
    filePath = '/admin.html';
  } else if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }

  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  let fullPath = path.join(__dirname, 'public', safePath);

  // If path points to folder but there is no file, check if it's a directory
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fullPath = path.join(fullPath, 'index.html');
    }
  } catch (e) {
    // File doesn't exist, will be caught below
  }

  // Check file extension
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve 404 page if index.html is missing or request is invalid
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Admin panel available at http://localhost:${PORT}/admin`);
});
