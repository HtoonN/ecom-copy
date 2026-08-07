import axios from 'axios';

export default {
  // other component options
  methods: {
    async fetchDatas() {
      const apiUrl = `http://localhost:5173/getWeek?date=${this.datetime}`; // Adjust the base URL as necessary
      try {
        const response = await axios.get(apiUrl);
        console.log(response.data);
        // Handle response data
      } catch (error) {
        console.error('Fetching data failed:', error);
        // Handle error
      }
    },
  },
}
