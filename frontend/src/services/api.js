export class ApiService {
  static async generateForecast(file, startMonth, endMonth) {
    const formData = new FormData();
    formData.append('train_file', file); // must match FastAPI param name
    formData.append('start_month', startMonth);
    formData.append('end_month', endMonth);

    const response = await fetch('http://127.0.0.1:8000/forecast', {
      method: 'POST',
      body: formData, // <-- do NOT set Content-Type manually
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response.json();
  }
}
