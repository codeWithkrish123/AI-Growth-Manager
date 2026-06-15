#!/bin/bash

# AI Growth Manager Deployment Script
# Deploys frontend to Vercel and backend to Render

set -e

echo "🚀 AI Growth Manager Deployment"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy Frontend
echo ""
echo "📱 Deploying Frontend to Vercel..."
cd frontend
npm install
npm run build
vercel --prod
cd ..

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Go to render.com and create account"
echo "2. Create PostgreSQL database"
echo "3. Deploy backend (see DEPLOYMENT_STEPS.md)"
echo "4. Update environment variables"
echo ""
echo "🎉 Frontend is live!"
