const API_BASE_URL = 'http://127.0.0.1:8000';

export class ApiService {
  static async generateForecast(file) {
    try {
      const formData = new FormData();
      formData.append('file', file); // must match "file" in FastAPI endpoint

      const response = await fetch(`${API_BASE_URL}/forecast`, {
        method: 'POST',
        body: formData, // no need to set headers, browser sets automatically
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to generate forecast. Please try again.');
    }
  }
}
