# AI CRM System - Deployment Guide

## AWS Infrastructure Setup

### Prerequisites
- AWS Account
- AWS CLI configured
- Terraform (optional, for infrastructure as code)

### 1. S3 Bucket Setup

Create S3 bucket for document storage:

```bash
aws s3 mb s3://ai-crm-documents --region us-east-1
```

Configure bucket policy for private access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/ai-crm-backend"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ai-crm-documents/*"
    }
  ]
}
```

Enable versioning (optional):
```bash
aws s3api put-bucket-versioning --bucket ai-crm-documents --versioning-configuration Status=Enabled
```

### 2. RDS MySQL Setup

Create RDS MySQL instance:

```bash
aws rds create-db-instance \
  --db-instance-identifier ai-crm-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"
```

### 3. ElastiCache Redis Setup

Create Redis cluster:

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id ai-crm-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name your-subnet-group \
  --security-group-ids sg-xxxxx
```

### 4. EC2 Instances Setup

#### Backend API Server

Launch EC2 instance:
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium (or larger for production)
- Security Group: Allow ports 80, 443, 8000

Install dependencies:
```bash
sudo apt update
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-redis php8.1-mbstring php8.1-xml php8.1-curl
sudo apt install -y composer nginx
```

Deploy backend:
```bash
cd /var/www
git clone YOUR_REPO backend
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Configure .env with production values
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Configure Nginx:
```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    root /var/www/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### Queue Worker Setup

Install Supervisor:
```bash
sudo apt install -y supervisor
```

Create supervisor configuration (`/etc/supervisor/conf.d/ai-crm-worker.conf`):
```ini
[program:ai-crm-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=3
redirect_stderr=true
stdout_logfile=/var/www/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Start workers:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ai-crm-worker:*
```

#### AI Service Server

Launch separate EC2 instance for AI service:
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium
- Security Group: Allow port 8001 (internal only)

Install Python and dependencies:
```bash
sudo apt update
sudo apt install -y python3.10 python3-pip python3-venv
```

Deploy AI service:
```bash
cd /opt
git clone YOUR_REPO ai-service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create systemd service (`/etc/systemd/system/ai-crm-service.service`):
```ini
[Unit]
Description=AI CRM Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/ai-service
Environment="PATH=/opt/ai-service/venv/bin"
ExecStart=/opt/ai-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-crm-service
sudo systemctl start ai-crm-service
```

#### Frontend Server

Launch EC2 instance for frontend:
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.small
- Security Group: Allow ports 80, 443

Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
```

Deploy frontend:
```bash
cd /var/www
git clone YOUR_REPO frontend
cd frontend
npm install
npm run build
```

Configure Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api.your-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. SSL Certificates

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain certificates:
```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 6. Environment Variables

Backend `.env`:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.your-domain.com

DB_HOST=ai-crm-db.xxxxx.us-east-1.rds.amazonaws.com
DB_DATABASE=ai_crm
DB_USERNAME=admin
DB_PASSWORD=YOUR_SECURE_PASSWORD

REDIS_HOST=ai-crm-redis.xxxxx.cache.amazonaws.com

AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=ai-crm-documents

AI_SERVICE_URL=http://internal-ai-service-ip:8001

MAIL_MAILER=ses
MAIL_FROM_ADDRESS=noreply@your-domain.com
```

Frontend `.env`:
```
VITE_API_URL=https://api.your-domain.com/api/v1
```

### 7. Monitoring & Logging

Set up CloudWatch for logs and metrics:

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

Configure log shipping for:
- Laravel logs: `/var/www/backend/storage/logs/laravel.log`
- Nginx access/error logs
- Queue worker logs
- AI service logs

### 8. Backup Strategy

- RDS automated backups (7-day retention)
- S3 versioning enabled
- Daily database dumps to S3:

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS ai_crm | gzip > /tmp/backup_$DATE.sql.gz
aws s3 cp /tmp/backup_$DATE.sql.gz s3://ai-crm-backups/
rm /tmp/backup_$DATE.sql.gz
```

Add to crontab:
```
0 2 * * * /usr/local/bin/backup-db.sh
```

### 9. Security Checklist

- [ ] All EC2 instances in private subnets (except load balancer)
- [ ] Security groups configured with minimal access
- [ ] RDS and Redis not publicly accessible
- [ ] SSL/TLS enabled for all public endpoints
- [ ] Environment variables secured (AWS Secrets Manager)
- [ ] IAM roles with least privilege
- [ ] Regular security updates enabled
- [ ] CloudTrail enabled for audit logging
- [ ] WAF configured on load balancer

### 10. Scaling Considerations

- Use Application Load Balancer for backend API
- Auto Scaling Groups for backend and frontend
- Read replicas for RDS if needed
- Redis cluster mode for high availability
- CloudFront CDN for frontend assets

## Docker Deployment (Alternative)

For simpler deployment, use Docker Compose:

```bash
# On production server
git clone YOUR_REPO
cd ai-crm-system
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Configure production values
docker-compose -f docker-compose.prod.yml up -d
```

See `docker-compose.prod.yml` for production configuration.
