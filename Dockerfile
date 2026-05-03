FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY backend/ /var/www/

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Expose port 10000 and start php-fpm server
EXPOSE 10000
CMD php artisan migrate --force; php artisan db:seed --force; php artisan serve --host=0.0.0.0 --port=10000
