# AI-Powered CRM System - Backend API

Laravel 10+ API backend for the AI-Powered CRM System.

## Requirements

- PHP 8.1+
- MySQL 8.0+
- Redis 6+
- Composer

## Installation

1. Install dependencies:
```bash
composer install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Generate application key:
```bash
php artisan key:generate
```

4. Configure database in `.env`:
```
DB_DATABASE=ai_crm
DB_USERNAME=root
DB_PASSWORD=your_password
```

5. Run migrations:
```bash
php artisan migrate
```

6. Start the development server:
```bash
php artisan serve
```

7. Start queue workers:
```bash
php artisan queue:work
```

## Testing

Run all tests:
```bash
php artisan test
```

Run property-based tests:
```bash
php artisan test --filter=Property
```

## API Documentation

API endpoints are prefixed with `/api/v1`.

Authentication uses Laravel Sanctum with Bearer tokens.

See `/docs/api.md` for complete API documentation.
