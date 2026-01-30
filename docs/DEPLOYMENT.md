# Deployment Guide - REdI Assessment System

This guide covers deploying the REdI Assessment System to production environments.

## Prerequisites

- **Node.js 20+** - For building the application
- **npm 9+** - Package manager
- **Supabase account** or **PostgreSQL 14+** - For the database
- **Domain with SSL certificate** - For HTTPS production deployments
- **Docker** (optional) - For containerized deployments

## Database Setup

### Option 1: Supabase (Recommended)

Supabase is the easiest way to get started and provides managed PostgreSQL with built-in real-time capabilities.

#### 1. Create Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project (choose your region wisely - pick one closest to your users)
3. Wait for the project to initialize (5-10 minutes)
4. Note your project URL and anon key from the Settings panel

#### 2. Run Database Migrations

Install Supabase CLI and link your project:

```bash
npm install -g supabase
supabase link --project-ref your-project-ref
```

Run the migrations:

```bash
supabase db push
```

This applies the schema from `supabase/migrations/20260125_initial_schema.sql`.

#### 3. Load Seed Data

In the Supabase dashboard:
1. Go to SQL Editor
2. Create a new query
3. Copy and paste contents of `supabase/seed.sql`
4. Execute

Or use psql:

```bash
psql postgresql://<user>:<password>@db.<project-ref>.supabase.co:5432/postgres \
  -f supabase/seed.sql
```

#### 4. Enable Realtime

In Supabase Dashboard:

1. Navigate to **Database → Replication**
2. Enable realtime for these tables:
   - `component_assessments`
   - `outcome_scores`
   - `overall_assessments`

This enables live updates when multiple assessors are working simultaneously.

#### 5. Configure RLS Policies

Basic RLS policies allow authenticated users full access. For production, refine these policies based on your security requirements:

1. Go to **Authentication → Policies**
2. Review the basic policies created by migrations
3. Consider restricting access by:
   - Course assignment
   - Assessor role
   - Specific participant lists

Current setup allows any authenticated user to see all data. Adjust for your use case.

### Option 2: Self-Hosted PostgreSQL

If running PostgreSQL on your own infrastructure:

#### 1. Create Database

```bash
createdb redi_assessment
```

#### 2. Run Schema Migration

```bash
psql -d redi_assessment -f supabase/migrations/20260125_initial_schema.sql
```

#### 3. Load Seed Data

```bash
psql -d redi_assessment -f supabase/seed.sql
```

#### 4. Enable Logical Replication (for realtime updates)

```sql
-- Connect as superuser
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_wal_senders = 4;
ALTER SYSTEM SET max_replication_slots = 4;

-- Restart PostgreSQL (command varies by OS)
```

Create publication for realtime:

```sql
CREATE PUBLICATION assessment_updates FOR TABLE
  component_assessments, outcome_scores, overall_assessments;
```

## Frontend Deployment

### Environment Variables

The frontend needs Supabase credentials. Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For self-hosted PostgreSQL, you'll need to set up a reverse proxy or middleware to translate the frontend requests.

### Build for Production

```bash
cd frontend
npm install
npm run build
```

This produces a production-optimized build in `frontend/dist/`.

**Build output is a static SPA** - just HTML, CSS, and JavaScript files. Can be served by any static file server.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel provides automatic deployments, HTTPS, and CDN caching.

#### 1. Connect Repository

1. Go to https://vercel.com
2. Import your Git repository
3. Select the `frontend` directory as root

#### 2. Set Environment Variables

In Vercel project settings:

- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

#### 3. Deploy

Push to your connected branch (e.g., `main`) and Vercel automatically deploys.

**Features:**
- Automatic HTTPS
- Global CDN
- Automatic rehashing of static assets
- Environment variable management

### Option 2: Docker

Use the provided Dockerfile for containerized deployments.

#### 1. Build Docker Image

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t redi-assessment:latest .
```

#### 2. Run Container

```bash
docker run -p 8080:80 redi-assessment:latest
```

Application is now available at `http://localhost:8080`.

#### 3. Configure for HTTPS

Use a reverse proxy (nginx, Traefik) in front of the Docker container to handle SSL termination.

Example nginx reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: Self-Hosted (Static Server)

Any static web server can serve the `dist/` directory.

#### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    root /var/www/redi-assessment/dist;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|gif|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Then deploy:

```bash
rsync -avz frontend/dist/ user@server:/var/www/redi-assessment/dist/
```

#### Node.js (express)

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(dirname + '/dist'));
app.get('*', (req, res) => {
  res.sendFile(dirname + '/dist/index.html');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Post-Deployment Checklist

### 1. Verify HTTPS

Open your domain in a browser and confirm:
- HTTPS lock icon appears
- No SSL/certificate warnings
- Certificate is valid

Check certificate details:
```bash
openssl s_client -connect yourdomain.com:443
```

### 2. Test Authentication

1. Open the application
2. Find the PIN field in the login form
3. Enter a test PIN from your seed data
4. Verify login succeeds and redirects to dashboard

Test assessor PINs from seed data (note: these are for testing only):
- Check `supabase/seed.sql` for sample assessor PIN hashes

### 3. Verify Real-Time Sync

1. Open the application in two browser windows/tabs
2. Log in as the same assessor in both
3. Open the same course/participant in both windows
4. Make a change in one window (e.g., score an outcome)
5. Verify the change appears instantly in the other window

**What to check:**
- No manual refresh required
- Changes appear within 1-2 seconds
- Both windows stay in sync

### 4. Verify CSP Headers

In browser DevTools (F12):

1. Go to **Network** tab
2. Click on the main document
3. Scroll to **Response Headers** section
4. Verify `Content-Security-Policy` header is present

Should show:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

This prevents XSS attacks while allowing Supabase connections.

### 5. Performance Check

In browser DevTools (F12):

1. Go to **Lighthouse** tab
2. Run **Mobile** and **Desktop** audits
3. Check scores are > 90 for Performance

If scores are low:
- Verify static assets are being cached (check Response Headers for `Cache-Control: public, immutable`)
- Check that dist/ is being served, not uncompressed source

### 6. Database Connection

In application console, verify Supabase is connected:

```javascript
// In browser DevTools Console
import { supabase } from './src/lib/supabase';
const { data, error } = await supabase.from('assessors').select('COUNT(*)');
console.log('Connected:', !error);
```

### 7. Check Error Logs

- Browser console (F12) - should show no errors
- Check your deployment platform logs:
  - **Vercel**: Deployments → Functions logs
  - **Docker**: `docker logs container-id`
  - **Nginx**: `/var/log/nginx/error.log`

## Rollback Procedure

If something breaks after deployment:

### Vercel

```bash
# Revert to previous deployment
vercel rollback
```

### Docker

```bash
# Roll back to previous image
docker run -p 8080:80 redi-assessment:previous-tag
```

### Manual Deployment

```bash
# Keep previous build as backup
mv /var/www/redi-assessment/dist /var/www/redi-assessment/dist.broken
mv /var/www/redi-assessment/dist.backup /var/www/redi-assessment/dist
```

## Troubleshooting

### Application blank or 404 errors

**Likely cause:** SPA routing not configured correctly

**Fix:**
- Ensure your server is configured to serve `index.html` for all routes
- Check nginx `try_files $uri $uri/ /index.html;`
- Check that `dist/` files exist and are readable

### Supabase connection errors

**Likely cause:** Wrong URL or key, or CORS issue

**Fix:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in environment
2. Check Supabase dashboard for API keys
3. Verify CORS is enabled in Supabase (usually auto-configured)
4. Check browser Network tab for request details

### Real-time updates not working

**Likely cause:** Realtime not enabled on tables

**Fix:**
1. Go to Supabase Dashboard → Database → Replication
2. Verify realtime is enabled for all three tables
3. Restart the application

### Slow performance

**Likely cause:** Static assets not cached properly

**Fix:**
1. Verify nginx/server has cache headers set
2. Check browser DevTools Network tab for `Cache-Control` header
3. Verify you're serving from `dist/`, not uncompressed source
4. Consider using a CDN (Cloudflare, Vercel Edge Network)

## Security Checklist

- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Database RLS policies reviewed for your use case
- [ ] Sample data (seed.sql) removed or updated with real credentials
- [ ] PIN hashes use bcrypt (not placeholder hashes)
- [ ] Regular backups enabled in Supabase
- [ ] Environment variables never committed to git
- [ ] `.env` files in `.gitignore`

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
