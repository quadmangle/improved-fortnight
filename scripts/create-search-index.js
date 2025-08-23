const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const pages = [
  'index.html',
  'contact-center.html',
  'it-support.html',
  'professional-services.html'
];

const searchIndex = [];

pages.forEach(page => {
  const filePath = path.resolve(__dirname, '..', page);
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const mainContent = dom.window.document.querySelector('main').textContent;

  searchIndex.push({
    url: page,
    content: mainContent.replace(/\s+/g, ' ').trim()
  });
});

const outputPath = path.resolve(__dirname, '..', 'js', 'search-index.json');
fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));

console.log('Search index created successfully!');
