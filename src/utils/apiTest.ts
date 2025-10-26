import apiClient from '../api/config';

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Test basic connectivity
    const response = await apiClient.get('/health', { timeout: 5000 });
    console.log('API Health Check Response:', response.data);
    return true;
  } catch (error: any) {
    console.error('API Connection Test Failed:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Connection timeout - Server might be down');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Server not found - Check URL and network');
    } else if (error.response) {
      console.error('Server responded with error:', error.response.status);
    } else {
      console.error('Network error:', error.message);
    }
    
    return false;
  }
};

// Test login with sample credentials
export const testLogin = async (): Promise<boolean> => {
  try {
    console.log('Testing login API...');
    
    const testCredentials = {
      email: 'nhoklideptrai@gmail.com',
      password: '123456'
    };
    
    const response = await apiClient.post('/auth/login', testCredentials);
    console.log('Login Test Response:', {
      status: response.status,
      data: response.data
    });
    
    if (response.data.code === 200 && response.data.data) {
      console.log('Login test successful! Token received');
      return true;
    } else {
      console.error('Login test failed:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('Login Test Failed:', error.message);
    
    if (error.response) {
      console.error('Server error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return false;
  }
};

// Comprehensive API test
export const runApiTests = async (): Promise<void> => {
  console.log('=== API CONNECTION TESTS ===');
  
  // Test 1: Basic connectivity
  console.log('\n1. Testing basic connectivity...');
  const connectionOk = await testApiConnection();
  
  if (!connectionOk) {
    console.log('❌ Basic connectivity failed');
    console.log('Please check:');
    console.log('- Server is running on localhost:8080');
    console.log('- Android emulator can access 10.0.2.2:8080');
    console.log('- No firewall blocking the connection');
    return;
  }
  
  console.log('✅ Basic connectivity OK');
  
  // Test 2: Login API
  console.log('\n2. Testing login API...');
  const loginOk = await testLogin();
  
  if (loginOk) {
    console.log('✅ Login API test successful');
    console.log('🎉 API is ready for use!');
  } else {
    console.log('❌ Login API test failed');
    console.log('Please check:');
    console.log('- Server endpoints are correct');
    console.log('- Database connection is working');
    console.log('- API response format matches expected structure');
  }
  
  console.log('\n=== END API TESTS ===');
};
