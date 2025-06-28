const http = require('http');

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'admin';

const server = http.createServer((req, res) => {
    console.log(`${SERVICE_NAME}: ${req.method} ${req.url} - Host: ${req.headers.host}`);
    
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: SERVICE_NAME,
            status: 'operational',
            adminFeatures: ['user-management', 'system-monitoring', 'configuration']
        }));
        return;
    }
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: SERVICE_NAME }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8fafc;
        }
        .header {
            background: #1e293b;
            color: white;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
        }
        .card h3 {
            margin-top: 0;
            color: #1e293b;
        }
        .metric {
            font-size: 2em;
            font-weight: bold;
            color: #3b82f6;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background: #f1f5f9;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Admin Dashboard</h1>
        <p>Host: ${req.headers.host} | Service: ${SERVICE_NAME}</p>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h3>System Status</h3>
                <div class="metric">All Systems Operational</div>
                <table>
                    <tr><td>Web Service</td><td>✅ Running</td></tr>
                    <tr><td>API Service</td><td>✅ Running</td></tr>
                    <tr><td>Admin Service</td><td>✅ Running</td></tr>
                    <tr><td>Nginx Proxy</td><td>✅ Running</td></tr>
                </table>
            </div>
            
            <div class="card">
                <h3>Request Info</h3>
                <table>
                    <tr><td>Host Header</td><td>${req.headers.host}</td></tr>
                    <tr><td>X-Real-IP</td><td>${req.headers['x-real-ip'] || 'N/A'}</td></tr>
                    <tr><td>X-Forwarded-For</td><td>${req.headers['x-forwarded-for'] || 'N/A'}</td></tr>
                    <tr><td>User-Agent</td><td>${req.headers['user-agent'] || 'N/A'}</td></tr>
                </table>
            </div>
            
            <div class="card">
                <h3>Quick Actions</h3>
                <button onclick="location.href='http://web.localhost'">Go to Web App</button>
                <button onclick="location.href='http://api.localhost'">View API</button>
                <button onclick="location.href='http://localhost'">Service Directory</button>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

server.listen(PORT, () => {
    console.log(`${SERVICE_NAME} service running on port ${PORT}`);
});
