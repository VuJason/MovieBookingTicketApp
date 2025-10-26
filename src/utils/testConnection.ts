// Simple connection test utility
export const testApiConnection = async () => {
  const testUrls = [
    'http://localhost:8080/api/auth/login',
    'http://10.0.2.2:8080/api/auth/login',
    'http://127.0.0.1:8080/api/auth/login',
  ];

  const testCredentials = {
    email: 'nhokleptrai@gmail.com',
    password: '123456'
  };

  console.log('🔍 Testing API connections...');

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCredentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      console.log(`✅ ${url} - Status: ${response.status}`);
      console.log(`📦 Response:`, data);
      
      if (data.code === 200) {
        console.log(`🎉 SUCCESS! Working URL: ${url}`);
        return url.replace('/auth/login', '');
      }
    } catch (error) {
      console.log(`❌ ${url} - Error:`, error);
    }
  }
  
  console.log('❌ No working URLs found');
  return null;
};

// Quick test function to call from component
export const quickTest = () => {
  testApiConnection().then(workingUrl => {
    if (workingUrl) {
      console.log(`✅ Use this URL in config: ${workingUrl}`);
    } else {
      console.log('❌ No working connection found');
    }
  });
};