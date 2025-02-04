# Agentx Platform 

A modern enterprise platform built with React, TypeScript, and Vite that provides intelligent business solutions.

## Prerequisites 

- Node.js 18.x or higher
- npm 9.x or higher

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Shadcn/ui
- **Type Safety:** TypeScript

## Project Structure

```
src/
├── components/
│   ├── Layout/         # Layout components
│   ├── Sidebar/        # Sidebar related components
│   ├── ui/             # Reusable UI components
│   └── ...
├── features/
│   └── Agents/         # Feature specific components
├── routes.tsx          # Application routes
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Getting Started

1. Check Node.js version
```bash
node --version  # Should be 18.x or higher
```

2. Clone the repository
```bash
git clone [repository-url]
```

3. Install dependencies
```bash
npm install
```

4. Start the development server
```bash
npm run dev
```

## Development

- The application uses Vite for fast development with HMR (Hot Module Replacement)
- Tailwind CSS is configured for styling
- TypeScript is set up for type safety
- ESLint and Prettier are configured for code quality

## Available Scripts

```bash
npm run dev          # Start development server
npm run dev:staging  # Start development server with staging config
npm run dev:prod     # Start development server with production config
npm run build        # Create development build
npm run build:staging # Create staging build
npm run build:prod   # Create production build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript type checking
```

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized assets in the `dist` directory.

## Contributing

Since this is a private repository, please follow these guidelines for contributing:

1. Create a new branch for your feature or fix
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them with clear messages
```bash
git commit -m "Description of changes"
```

3. Push your changes
```bash
git push origin feature/your-feature-name
```

4. Create a pull request in your organization's repository

## Environment Configuration

The application supports three environments:

| Environment | Command | .env file | Use Case |
|------------|---------|-----------|-----------|
| Development | `npm run dev` | `.env.development` | Local development |
| Staging | `npm run dev:staging` | `.env.staging` | Testing/QA |
| Production | `npm run dev:prod` | `.env.production` | Production |

### Building for Environments

```bash
# Development build
npm run build

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

### Vercel Deployment

The application uses the following configuration for Vercel environments:

- Production (main branch): Uses `.env.production`
- Preview (PR): Uses `.env.staging`
- Development: Uses `.env.development`

Required environment variables in Vercel:
- `VITE_APP_NAME`
- `VITE_API_URL`

## License

Private repository -  All rights reserved
