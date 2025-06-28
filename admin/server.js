const http = require('http');

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'admin';

// Health check function
async function checkServiceHealth(serviceName, port) {
    return new Promise((resolve) => {
        const options = {
            hostname: serviceName,
            port: port,
            path: '/health',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve({ 
                            status: 'healthy', 
                            service: serviceName,
                            details: json 
                        });
                    } catch (e) {
                        resolve({ 
                            status: 'healthy', 
                            service: serviceName,
                            details: { message: 'Non-JSON response' }
                        });
                    }
                });
            } else {
                resolve({ 
                    status: 'unhealthy', 
                    service: serviceName,
                    statusCode: res.statusCode 
                });
            }
        });

        req.on('error', (error) => {
            resolve({ 
                status: 'unreachable', 
                service: serviceName,
                error: error.message 
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ 
                status: 'timeout', 
                service: serviceName,
                error: 'Request timeout' 
            });
        });

        req.end();
    });
}

// Check nginx health by trying to reach the main page
async function checkNginxHealth() {
    return new Promise((resolve) => {
        // We'll check if nginx is responding by hitting our own admin endpoint through nginx
        const options = {
            hostname: 'nginx',
            port: 80,
            path: '/health',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve({ 
                    status: 'healthy', 
                    service: 'nginx',
                    details: { message: 'Proxy responding' }
                });
            } else {
                resolve({ 
                    status: 'unhealthy', 
                    service: 'nginx',
                    statusCode: res.statusCode 
                });
            }
        });

        req.on('error', (error) => {
            resolve({ 
                status: 'unreachable', 
                service: 'nginx',
                error: error.message 
            });
        });

        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    console.log(`${SERVICE_NAME}: ${req.method} ${req.url} - Host: ${req.headers.host}`);
    
    // API endpoint for real-time health data
    if (req.url === '/api/health-check') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        
        // Check all services in parallel
        const [webHealth, apiHealth, nginxHealth] = await Promise.all([
            checkServiceHealth('web', 3000),
            checkServiceHealth('api', 3000),
            checkNginxHealth()
        ]);
        
        const adminHealth = { 
            status: 'healthy', 
            service: 'admin',
            details: { message: 'Self-check' }
        };
        
        res.end(JSON.stringify({
            timestamp: new Date().toISOString(),
            services: {
                web: webHealth,
                api: apiHealth,
                admin: adminHealth,
                nginx: nginxHealth
            }
        }));
        return;
    }
    
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
    
    // Main admin panel with dynamic health checking
    res.writeHead(200, { 'Content-Type': 'text/html' });
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
            font-size: 1.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric.healthy { color: #10b981; }
        .metric.unhealthy { color: #ef4444; }
        .metric.checking { color: #f59e0b; }
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
        .status-icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
            vertical-align: middle;
        }
        .status-healthy { background-color: #10b981; }
        .status-unhealthy { background-color: #ef4444; }
        .status-unreachable { background-color: #6b7280; }
        .status-timeout { background-color: #f59e0b; }
        .status-checking { 
            background-color: #3b82f6;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover { background: #2563eb; }
        .last-check {
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
        }
        .error-detail {
            font-size: 12px;
            color: #ef4444;
            margin-left: 30px;
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
                <h3>
                    System Status 
                    <button class="refresh-btn" onclick="checkHealth()">Refresh</button>
                </h3>
                <div id="overall-status" class="metric checking">Checking...</div>
                <table id="service-status">
                    <tr>
                        <td>Web Service</td>
                        <td><span class="status-icon status-checking"></span>Checking...</td>
                    </tr>
                    <tr>
                        <td>API Service</td>
                        <td><span class="status-icon status-checking"></span>Checking...</td>
                    </tr>
                    <tr>
                        <td>Admin Service</td>
                        <td><span class="status-icon status-checking"></span>Checking...</td>
                    </tr>
                    <tr>
                        <td>Nginx Proxy</td>
                        <td><span class="status-icon status-checking"></span>Checking...</td>
                    </tr>
                </table>
                <div class="last-check" id="last-check"></div>
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
                <hr style="margin: 15px 0;">
                <button onclick="testEndpoint('web')">Test Web Endpoint</button>
                <button onclick="testEndpoint('api')">Test API Endpoint</button>
            </div>
            
            <div class="card">
                <h3>Service Health Details</h3>
                <div id="health-details" style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">
                    Waiting for health check...
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let healthCheckInterval;
        
        async function checkHealth() {
            const statusTable = document.getElementById('service-status');
            const overallStatus = document.getElementById('overall-status');
            const lastCheck = document.getElementById('last-check');
            const healthDetails = document.getElementById('health-details');
            
            try {
                const response = await fetch('/api/health-check');
                const data = await response.json();
                
                let allHealthy = true;
                let statusHTML = '';
                
                const services = [
                    { name: 'Web Service', key: 'web' },
                    { name: 'API Service', key: 'api' },
                    { name: 'Admin Service', key: 'admin' },
                    { name: 'Nginx Proxy', key: 'nginx' }
                ];
                
                services.forEach(({ name, key }) => {
                    const service = data.services[key];
                    const statusClass = 'status-' + service.status;
                    let statusText = service.status.charAt(0).toUpperCase() + service.status.slice(1);
                    
                    if (service.status !== 'healthy') {
                        allHealthy = false;
                        if (service.error) {
                            statusText += ': ' + service.error;
                        }
                    }
                    
                    statusHTML += '<tr>';
                    statusHTML += '<td>' + name + '</td>';
                    statusHTML += '<td><span class="status-icon ' + statusClass + '"></span>' + statusText + '</td>';
                    statusHTML += '</tr>';
                });
                
                statusTable.innerHTML = statusHTML;
                
                if (allHealthy) {
                    overallStatus.textContent = 'All Systems Operational';
                    overallStatus.className = 'metric healthy';
                } else {
                    overallStatus.textContent = 'System Issues Detected';
                    overallStatus.className = 'metric unhealthy';
                }
                
                lastCheck.textContent = 'Last checked: ' + new Date(data.timestamp).toLocaleTimeString();
                healthDetails.textContent = JSON.stringify(data, null, 2);
                
            } catch (error) {
                overallStatus.textContent = 'Health Check Failed';
                overallStatus.className = 'metric unhealthy';
                statusTable.innerHTML = '<tr><td colspan="2">Error: ' + error.message + '</td></tr>';
                healthDetails.textContent = 'Error: ' + error.message;
            }
        }
        
        async function testEndpoint(service) {
            const url = service === 'web' ? 'http://web.localhost' : 'http://api.localhost/data';
            try {
                const response = await fetch(url);
                const data = await response.text();
                alert('Success! Response: ' + data.substring(0, 100) + '...');
            } catch (error) {
                alert('Failed to reach ' + service + ': ' + error.message);
            }
        }
        
        // Initial check
        checkHealth();
        
        // Auto-refresh every 5 seconds
        healthCheckInterval = setInterval(checkHealth, 5000);
        
        // Clean up interval if page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(healthCheckInterval);
            } else {
                checkHealth();
                healthCheckInterval = setInterval(checkHealth, 5000);
            }
        });
    </script>
</body>
</html>
    `);
});

server.listen(PORT, () => {
    console.log(`${SERVICE_NAME} service running on port ${PORT}`);
});
