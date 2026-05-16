const fs = require('fs'); 
const content = fs.readFileSync('e:/FSWD/Project/prium.github.io/phoenix/v1.24.0/apps/e-commerce/landing/homepage.html', 'utf8'); 
const startIdx = content.indexOf('<div class="ecommerce-homepage pt-5 mb-9">'); 
const endIdx = content.indexOf('<section class="bg-body-highlight dark__bg-gray-1100 py-9">'); 
if(startIdx !== -1 && endIdx !== -1) { 
  fs.writeFileSync('e:/FSWD/Project/shopzone/client/src/pages/customer/extracted-homepage.html', content.substring(startIdx, endIdx)); 
  console.log('Extracted ' + (endIdx - startIdx) + ' bytes'); 
} else { 
  console.log('Not found ' + startIdx + ' ' + endIdx); 
}
