#!/bin/bash

echo "🚀 KontrakanKu Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📁 Navigating to frontend directory..."
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Ready to deploy to Vercel!"
    echo ""
    echo "Next steps:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Login to Vercel: vercel login"
    echo "3. Deploy: vercel"
    echo ""
    echo "Or push to GitHub and deploy via Vercel Dashboard"
    echo ""
    echo "📋 Don't forget to:"
    echo "- Create Supabase storage buckets (properti-photos, ktp-documents, kwitansi-receipts)"
    echo "- Set environment variables in Vercel"
    echo "- Test the deployment"
else
    echo "❌ Build failed!"
    echo "Please check the error messages above."
    exit 1
fi