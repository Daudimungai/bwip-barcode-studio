const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

// Test AAMVA string
const sampleAamva = "@\n\x1e\rANSI 636000080001DL00300240DLDAQC7289427\nDACJoe\nDCSMeza\nDADWilliam\nDAG516 Anson Ct\nDAIRonhert Park\nDAK875420000\nDCAC\nDBC1\nDBB09021997\nDBD12012020\nDBA09022025\nDCF12/01/202098838/AAFD/25\nDCK20336C72894270401\n\r";

bwipjs.toBuffer({
  bcid: 'pdf417',
  text: sampleAamva,
  scale: 3,
  columns: 14,
  eclevel: 5
}, (err, png) => {
  if (err) {
    console.error('Error generating PDF417 buffer:', err);
  } else {
    fs.writeFileSync(path.join(__dirname, 'test_dl_pdf417.png'), png);
    console.log('✅ Successfully generated test_dl_pdf417.png (Size:', png.length, 'bytes)');
  }
});
