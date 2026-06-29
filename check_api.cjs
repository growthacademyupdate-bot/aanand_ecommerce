const http = require('http');

async function checkAPI() {
  try {
    const response = await new Promise((resolve, reject) => {
      http.get('http://localhost:3003/api/products', (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      }).on('error', reject);
    });
    
    const gardenMuse = response.data.find(p => p.name === 'Garden Muse Saree PT11');
    if (gardenMuse) {
      const yellowVariant = gardenMuse.colors.find(c => c.colorName === 'Yellow');
      console.log('🔍 YELLOW VARIANT CHECK:', {
        yellowStock: yellowVariant?.stock,
        shouldShowZeroMessage: yellowVariant?.stock === 0
      });
    }
  } catch (error) {
    console.error('API check error:', error);
  }
}

checkAPI();
