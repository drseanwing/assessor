# Frontend builder for deployment
# Usage: docker build -t redi-frontend-builder --build-arg VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY .
# Extract built files: docker create --name temp redi-frontend-builder && docker cp temp:/app/dist ./dist && docker rm temp

FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY frontend/ ./
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

# Built files are in /app/dist
CMD ["echo", "Frontend built successfully. Extract /app/dist to deploy to nginx."]
