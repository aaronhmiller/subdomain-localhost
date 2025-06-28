# Using subdomains and reverse proxy
## Usage
* docker compose up --build -d
* open [localhost](http://localhost)
## Key Advantages of This Setup
* Production Parity: This mirrors how real applications work - users access everything through port 80/443, with nginx handling routing based on the Host header. This has been the standard approach since nginx's rise in the mid-2000s.
* Service Isolation: Each service runs in its own container with its own memory space. You can update, restart, or scale services independently without affecting others.
* Network Security: Services aren't directly exposed to the host - only nginx has published ports. Inter-service communication happens on the internal Docker network.
