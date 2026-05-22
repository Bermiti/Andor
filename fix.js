const fs = require('fs');
const files = [
  'app/api/generate-itinerary/route.js',
  'app/components/CreationWizard.js',
  'app/itinerary/[id]/page.js'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  // Replace escaped backticks with actual backticks
  text = text.replace(/\\`/g, '`');
  // Replace escaped ${ with actual ${
  text = text.replace(/\\\${/g, '${');
  fs.writeFileSync(f, text);
  console.log('Fixed', f);
});
