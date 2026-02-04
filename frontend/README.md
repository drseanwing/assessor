# REdI Assessment - Frontend

React + TypeScript + Vite frontend application for the REdI Assessment System.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase JS Client** - Database and realtime subscriptions
- **Zustand** - State management
- **React Router** - Routing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project (or self-hosted PostgreSQL)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # React components
│   ├── assessment/ # Assessment-related components
│   ├── dashboard/  # Dashboard components
│   └── ui/         # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Libraries and utilities
│   └── supabase.ts # Supabase client configuration
├── pages/          # Page components
├── stores/         # Zustand stores
├── types/          # TypeScript type definitions
│   └── database.ts # Database types
├── App.tsx         # Main app component
└── main.tsx        # Application entry point
```

## Features

### Phase 1: Foundation (Complete)
- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS configuration
- ✅ Supabase client setup
- ✅ Type definitions
- ✅ Auth store with Zustand
- ✅ PIN authentication
- ✅ Course and participant listing

### Phase 2: Assessment Entry (Complete)
- ✅ Assessment panel layout
- ✅ Bondy scale selector
- ✅ Quick pass button
- ✅ Auto-save functionality

### Phase 3: Real-Time Sync (Complete)
- ✅ Realtime subscriptions
- ✅ Presence indicators
- ✅ Conflict resolution

### Phase 4: Dashboard (Complete)
- ✅ Dashboard grid
- ✅ Progress visualization
- ✅ Feedback aggregation

## Configuration

### Tailwind CSS

The Tailwind configuration is in `tailwind.config.js`. Customize theme colors, fonts, and other design tokens there.

### Supabase

The Supabase client is configured in `src/lib/supabase.ts` with:
- Session persistence
- Auto token refresh
- Realtime configuration

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

1. Implement PIN authentication UI
2. Create course listing page
3. Build participant list view
4. Develop assessment entry panel
5. Add Bondy scale selector component

## Contributing

See main project README for contribution guidelines.
