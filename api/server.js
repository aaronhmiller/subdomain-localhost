const http = require('http');

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'api';

const server = http.createServer((req, res) => {
    console.log(`${SERVICE_NAME}: ${req.method} ${req.url} - Host: ${req.headers.host}`);
    
    // Set CORS headers (nginx also adds them, but good to have here too)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle different endpoints
    switch(req.url) {
        case '/':
            res.writeHead(200);
            res.end(JSON.stringify({
                service: SERVICE_NAME,
                version: '1.0.0',
                endpoints: ['/data', '/users', '/status', '/health']
            }));
            break;
            
        case '/data':
            res.writeHead(200);
            res.end(JSON.stringify({
                message: 'Hello from API service',
                timestamp: new Date().toISOString(),
                service: SERVICE_NAME,
                host: req.headers.host,
                data: {
                    items: [
                        { id: 1, name: 'Item 1', value: 100 },
                        { id: 2, name: 'Item 2', value: 200 }
                    ]
                }
            }));
            break;
            
        case '/users':
            res.writeHead(200);
            res.end(JSON.stringify({
                users: [
                    { id: 1, name: 'Alice', role: 'admin' },
                    { id: 2, name: 'Bob', role: 'user' },
                    { id: 3, name: 'Charlie', role: 'user' }
                ]
            }));
            break;
            
        case '/status':
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'operational',
                service: SERVICE_NAME,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }));
            break;
            
        case '/health':
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'healthy', service: SERVICE_NAME }));
            break;
            
        default:
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found', path: req.url }));
    }
});

server.listen(PORT, () => {
    console.log(`${SERVICE_NAME} service running on port ${PORT}`);
});
