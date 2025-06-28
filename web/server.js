const http = require('http');

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'web';

const server = http.createServer((req, res) => {
    console.log(`${SERVICE_NAME}: ${req.method} ${req.url} - Host: ${req.headers.host}`);
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: SERVICE_NAME }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Web Frontend</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        h1 { color: #2563eb; }
        .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #2563eb; }
        #output {
            background: #1e293b;
            color: #f1f5f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>Web Frontend Service</h1>
    
    <div class="card">
        <h2>Service Information</h2>
        <p><strong>Host:</strong> ${req.headers.host}</p>
        <p><strong>Service:</strong> ${SERVICE_NAME}</p>
        <p><strong>Internal Port:</strong> ${PORT}</p>
        <p><strong>X-Forwarded-For:</strong> ${req.headers['x-forwarded-for'] || 'N/A'}</p>
    </div>
    
    <div class="card">
        <h2>Test Cross-Subdomain Communication</h2>
        <button onclick="testAPI()">Call API Service</button>
        <button onclick="checkAdmin()">Check Admin Status</button>
        <button onclick="testCORS()">Test CORS</button>
        <div id="output"></div>
    </div>
    
    <script>
        function log(message) {
            const output = document.getElementById('output');
            output.textContent = message;
        }
        
        async function testAPI() {
            try {
                log('Calling API service...');
                const response = await fetch('http://api.localhost/data');
                const data = await response.json();
                log('API Response:\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                log('Error calling API: ' + error.message);
            }
        }
        
        async function checkAdmin() {
            try {
                log('Checking admin service...');
                const response = await fetch('http://admin.localhost/status');
                const data = await response.json();
                log('Admin Response:\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                log('Error checking admin: ' + error.message);
            }
        }
        
        async function testCORS() {
            try {
                log('Testing CORS with credentials...');
                const response = await fetch('http://api.localhost/data', {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                log('CORS Test Success:\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                log('CORS Test Failed: ' + error.message);
            }
        }
    </script>
</body>
</html>
    `);
});

server.listen(PORT, () => {
    console.log(`${SERVICE_NAME} service running on port ${PORT}`);
});
