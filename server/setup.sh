#!/bin/bash

echo "🚀 Setting up Express Server..."

# Check if serviceAccountKey.json exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ Error: serviceAccountKey.json not found!"
    echo ""
    echo "Please download your Firebase service account key:"
    echo "1. Go to: https://console.firebase.google.com/project/up-down-cards/settings/serviceaccounts/adminsdk"
    echo "2. Click 'Generate new private key'"
    echo "3. Save as 'serviceAccountKey.json' in the server/ directory"
    exit 1
fi

echo "✅ Service account key found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the server:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo "  Docker:      docker-compose up -d"
