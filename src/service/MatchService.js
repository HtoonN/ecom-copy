import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const getWeek = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/getWeek?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching week data:', error);
    throw error;
  }
};
