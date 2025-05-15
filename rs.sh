# Check if the rs-cache.sh file exists
if [ ! -f "src/bot/scripts/rs-cache.sh" ]; then
  echo "❌ File rs-cache.sh not found!"
  exit 1
fi

# Run the rs-cache.sh script
echo "🔄 Resetting bot..."
sh src/bot/scripts/rs-cache.sh