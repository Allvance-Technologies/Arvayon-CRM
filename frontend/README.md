# AI-Powered CRM System - Frontend

React 18+ frontend application with TypeScript, Zustand, and Tailwind CSS.

## Requirements

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure API URL in `.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

```bash
npm run build
```

## Testing

Run all tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── features/         # Feature-specific components
├── stores/           # Zustand state management
├── services/         # API service layer
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```
