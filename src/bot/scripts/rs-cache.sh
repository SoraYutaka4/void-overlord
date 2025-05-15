# Get the directory of the script
watchDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/"
flagFile="rscache.flag"

# If the flag file already exists, delete it first
if [ -f "$watchDir$flagFile" ]; then
    rm "$watchDir$flagFile"
    echo "🗑 Deleted old file: $flagFile"
fi

# Create a new flag file
touch "$watchDir$flagFile"
echo "🚀 Created file $flagFile in $watchDir"
echo "🔄 Watching for $flagFile..."

# Start watching the file
while true; do
    if [ ! -f "$watchDir$flagFile" ]; then
        echo "✅ File $flagFile has been deleted! Reset successful!"
        exit 0
    fi
    sleep 2
done