#!/bin/bash
# Cleanup remaining console logs silently

files=(
  "app/components/FloatingAi.js"
  "app/components/ItineraryGenerator.js"
  "app/components/QuickPlan.js"
  "app/components/Social.js"
  "app/api/adapt-itinerary/route.js"
  "app/api/generate-itinerary/route.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Use sed to remove console statements inline
    sed -i.bak 's/.*console\.\(log\|error\|warn\|debug\)([^)]*);.*//' "$file"
    rm -f "$file.bak"
  fi
done

echo "✅ Console cleanup complete"
