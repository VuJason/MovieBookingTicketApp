// Network testing utilities
export const NetworkTest = {
  // Test basic connectivity
  async testConnection(url: string): Promise<boolean> {
    try {
      console.log('Testing connection to:', url);
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
      });
      console.log('Connection test result:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  // Get local IP addresses for development
  getLocalIPs(): string[] {
    return [
      'http://10.0.2.2:8080/api',     // Android emulator
      'http://127.0.0.1:8080/api',    // iOS simulator  
      'http://localhost:8080/api',    // Web/desktop
      'http://192.168.1.100:8080/api', // Replace with your actual IP
    ];
  },

  // Test multiple endpoints
  async findWorkingEndpoint(endpoints: string[]): Promise<string | null> {
    for (const endpoint of endpoints) {
      const isWorking = await this.testConnection(endpoint);
      if (isWorking) {
        console.log('Found working endpoint:', endpoint);
        return endpoint;
      }
    }
    return null;
  }
};