#!/bin/bash
# PART 1 FIX: Remove all console.log/error/warn/debug statements

for file in \
  "app/my-favorites/page.js" \
  "app/api/adapt-itinerary/route.js" \
  "app/api/regenerate-day/route.js" \
  "app/components/CreationWizard.js" \
  "app/components/ErrorBoundary.js" \
  "app/components/FloatingAi.js" \
  "app/components/ItineraryGenerator.js" \
  "app/components/QuickPlan.js" \
  "app/components/Social.js" \
  "app/itinerary/[id]/page.js" \
  "app/lib/itinerary-store.js" \
  "app/lib/itinerary-validate.js"
do
  if [ -f "$file" ]; then
    # Remove console.log/error/warn/debug statements
    sed -i 's/.*console\.\(log\|error\|warn\|debug\)([^)]*);.*//' "$file"
    # Clean up empty lines
    sed -i '/^[[:space:]]*$/N;/^\n$/D' "$file"
    echo "✓ $file cleaned"
  fi
done

echo "✅ All console statements removed"
