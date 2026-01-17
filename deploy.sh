#!/bin/bash
# Quick Netlify Deployment Setup

echo "🚀 AI Interview Coach - Netlify Deployment Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please add your GEMINI_API_KEY."
else
    echo "✅ .env file already exists"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm version: $(npm -v)"

echo ""
echo "📋 Deployment Steps:"
echo "1. Install Netlify CLI (if not already installed):"
echo "   npm install -g netlify-cli"
echo ""
echo "2. Go to netlify.com and sign up/login"
echo ""
echo "3. Option A - Deploy from GitHub (Recommended):"
echo "   - Click 'Add new site' → 'Import an existing project'"
echo "   - Connect your GitHub repository"
echo "   - Set GEMINI_API_KEY in Netlify environment variables"
echo ""
echo "4. Option B - Deploy with Netlify CLI:"
echo "   netlify login"
echo "   netlify deploy --prod"
echo ""
echo "5. Visit https://YOURSITE.netlify.app to view your live app"
echo ""
echo "📚 For detailed instructions, see NETLIFY_DEPLOYMENT.md"
echo ""
