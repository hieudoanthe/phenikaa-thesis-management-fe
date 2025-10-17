import mainHttpClient from "./mainHttpClient";

class SuggestionsService {
  async getHistory({ studentId, page = 0, size = 10 }) {
    const res = await mainHttpClient.get(
      `/api/thesis-service/suggestions/history`,
      { params: { studentId, page, size } }
    );
    return res?.data;
  }

  async rate({ studentId, topicTitle, feedback }) {
    const res = await mainHttpClient.post(
      `/api/thesis-service/suggestions/rate`,
      null,
      { params: { studentId, topicTitle, feedback } }
    );
    return res?.data;
  }

  async findSimilar({ topicTitle, limit = 5 }) {
    const res = await mainHttpClient.get(
      `/api/thesis-service/suggestions/similar`,
      { params: { topicTitle, limit } }
    );
    return res?.data;
  }

  async upsertPreferences({ studentId, areas, keywords, types }) {
    const res = await mainHttpClient.post(
      `/api/thesis-service/suggestions/preferences`,
      null,
      { params: { studentId, areas, keywords, types } }
    );
    return res?.data;
  }
}

const suggestionsService = new SuggestionsService();
export default suggestionsService;
