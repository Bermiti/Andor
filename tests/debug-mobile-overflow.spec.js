const { test, expect } = require('@playwright/test');

function makeTokyoItinerary() {
  return {
    destination: 'Tokyo, Japan',
    days: [
      { title: 'Arrival', stops: [{ name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } }] },
      { title: 'Sightseeing', stops: [{ name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } }] }
    ]
  };
}

function encodeSharePayload(itin) {
  const json = JSON.stringify(itin);
  return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
}

test.describe('Mobile Overflow Debug', () => {
  test('375px DOM overflow scanner', async ({ page, baseURL }) => {
    const tokyo = makeTokyoItinerary();
    const payload = encodeSharePayload(tokyo);
    await page.goto(`${baseURL}/itinerary/share?data=${payload}`, { waitUntil: 'networkidle' });

    // Set to 375px mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Run DOM overflow scanner
    const overflowReport = await page.evaluate(() => {
      const viewport = window.innerWidth;
      const results = [];

      // Recursively walk all visible elements
      function walkElements(el, depth = 0) {
        if (depth > 50) return; // Limit recursion

        try {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          
          // Check if element overflows horizontally
          const overflowsRight = rect.right > viewport;
          const hasScrollWidth = el.scrollWidth > el.clientWidth;
          
          if (overflowsRight || hasScrollWidth) {
            results.push({
              tag: el.tagName.toLowerCase(),
              className: el.className || '(none)',
              id: el.id || '(none)',
              textSnippet: el.textContent?.substring(0, 50).replace(/\n/g, ' ') || '(empty)',
              boundingBoxWidth: rect.width,
              left: rect.left,
              right: rect.right,
              computedDisplay: style.display,
              computedPosition: style.position,
              computedWidth: style.width,
              computedMinWidth: style.minWidth,
              computedOverflowX: style.overflowX,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              parentClassName: el.parentElement?.className || '(root)',
              parentTag: el.parentElement?.tagName?.toLowerCase() || '(root)',
            });
          }
        } catch (e) {
          // Ignore errors on certain elements
        }

        for (let child of el.children) {
          walkElements(child, depth + 1);
        }
      }

      walkElements(document.documentElement);
      return results;
    });

    console.log('\n=== MOBILE OVERFLOW DEBUG REPORT ===');
    console.log(`Viewport: ${page.viewportSize().width}px`);
    console.log(`Document scrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
    console.log(`Overflowing elements found: ${overflowReport.length}`);
    console.log('\n');

    // Sort by right coordinate (furthest right first)
    overflowReport.sort((a, b) => b.right - a.right);

    // Print detailed report for each overflowing element
    overflowReport.forEach((el, idx) => {
      console.log(`\n[${idx + 1}] ${el.tag.toUpperCase()}${el.id ? ` #${el.id}` : ''}${el.className ? ` .${el.className}` : ''}`);
      console.log(`  Text: "${el.textSnippet}"`);
      console.log(`  Bounding box: width=${el.boundingBoxWidth.toFixed(1)}, left=${el.left.toFixed(1)}, right=${el.right.toFixed(1)}`);
      console.log(`  OVERFLOW: right=${el.right.toFixed(1)} > viewport=${375}`);
      console.log(`  Computed: display=${el.computedDisplay}, position=${el.computedPosition}`);
      console.log(`  Size: width=${el.computedWidth}, min-width=${el.computedMinWidth}`);
      console.log(`  Scroll: scrollWidth=${el.scrollWidth}, clientWidth=${el.clientWidth}, overflow-x=${el.computedOverflowX}`);
      console.log(`  Parent: <${el.parentTag}${el.parentClassName ? ` .${el.parentClassName}` : ''}>`);
    });

    console.log('\n=== END REPORT ===\n');

    // Store results for assertion
    expect(overflowReport.length).toBeGreaterThanOrEqual(0);
  });
});
