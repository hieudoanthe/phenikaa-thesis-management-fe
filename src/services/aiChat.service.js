import mainHttpClient from "./mainHttpClient";

class AiChatService {
  async chat({ message, userId, sessionId }) {
    const payload = { message, userId, sessionId };
    const res = await mainHttpClient.post(
      "/api/thesis-service/ai-chat/chat",
      payload
    );
    return res?.data;
  }
}

const aiChatService = new AiChatService();
export default aiChatService;
