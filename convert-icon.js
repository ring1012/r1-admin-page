const fs = require('fs');
const pngToIco = require('png-to-ico');

const inputPath = 'src/app/icon.png';
const outputPath = 'public/favicon.ico';

pngToIco(inputPath)
  .then(buf => {
    fs.writeFileSync(outputPath, buf);
    console.log(`Successfully converted ${inputPath} to ${outputPath}`);
  })
  .catch(err => {
    console.error('Error during conversion:', err);
    process.exit(1);
  });
