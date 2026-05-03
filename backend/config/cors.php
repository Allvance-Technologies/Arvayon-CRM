<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'https://allvance-technologies.github.io',
        'http://localhost:3000',
        'http://localhost:8111'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'X-CSRF-TOKEN', 'Accept'],

    'exposed_headers' => ['X-Total-Count'],

    'max_age' => 86400, // Cache preflight for 24 hours

    'supports_credentials' => true,
];
