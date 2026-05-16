const fs = require('fs');
let html = fs.readFileSync('e:/FSWD/Project/shopzone/client/src/pages/customer/extracted-homepage.html', 'utf8');

// Replace Phoenix specific terms
html = html.replace(/Phoenix/g, 'ShopZone');
html = html.replace(/phoenix/g, 'shopzone');
html = html.replace(/info@shopzone\.com/g, 'info@shopzone.com'); // if any

// Replace asset paths
html = html.replace(/\/prium\.github\.io\/shopzone\/v1\.24\.0/g, ''); // wait, it was originally phoenix, I just replaced phoenix with shopzone!
html = html.replace(/\/prium\.github\.io\/phoenix\/v1\.24\.0/g, ''); 

// But wait, the first replacement replaced "phoenix" with "shopzone". So the path became:
// /prium.github.io/shopzone/v1.24.0
// So I should replace that instead.
html = html.replace(/\/prium\.github\.io\/shopzone\/v1\.24\.0/g, '');

// Fix HTML to JSX mappings
html = html.replace(/class=/g, 'className=');
html = html.replace(/for=/g, 'htmlFor=');
html = html.replace(/tabindex=/g, 'tabIndex=');
html = html.replace(/autocomplete=/g, 'autoComplete=');

// Self closing tags (img, input, hr, br)
html = html.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
html = html.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
html = html.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
html = html.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');

// Style attribute string to object conversion (basic)
html = html.replace(/style="([^"]*)"/g, (match, p1) => {
    const parts = p1.split(';').filter(Boolean);
    const styleObj = {};
    parts.forEach(part => {
        const [key, val] = part.split(':').map(s => s.trim());
        if (key && val) {
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            styleObj[camelKey] = val;
        }
    });
    return `style={${JSON.stringify(styleObj)}}`;
});

// React component structure
const jsx = `
import { Link } from 'react-router-dom';

export default function Homepage() {
  return (
    <>
${html}
    </>
  );
}
`;

fs.writeFileSync('e:/FSWD/Project/shopzone/client/src/pages/customer/HomepageNew.jsx', jsx);
console.log('JSX component generated at HomepageNew.jsx');
