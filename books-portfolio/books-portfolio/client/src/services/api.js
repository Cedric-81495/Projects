import axios from 'axios';

const BASE_URL = 'https://api.potterdb.com/v1';

export const getBooks = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/books`);
    return res.data.data;
  } catch (error) {
    console.error('API error:', error);
    return [];
  }
};
