import { API_ENDPOINTS } from "../config/api";
import mainHttpClient from "./mainHttpClient";

// Base URL cho Communication Service
const COMMUNICATION_SERVICE_URL = "http://localhost:8088";

class ChatService {
  /**
   * Gửi tin nhắn chat
   * @param {Object} messageData - Dữ liệu tin nhắn
   * @param {string} messageData.senderId - ID người gửi
   * @param {string} messageData.receiverId - ID người nhận
   * @param {string} messageData.content - Nội dung tin nhắn
   * @param {string} messageData.timestamp - Thời gian gửi (ISO string)
   * @returns {Promise<Object>} Tin nhắn đã gửi
   */
  async sendMessage(messageData) {
    try {
      // Sử dụng base URL cho communication service
      const response = await mainHttpClient.post(
        API_ENDPOINTS.SEND_CHAT_MESSAGE,
        messageData,
        {
          baseURL: COMMUNICATION_SERVICE_URL,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử chat giữa 2 user
   * @param {string} user1 - ID user thứ nhất
   * @param {string} user2 - ID user thứ hai
   * @returns {Promise<Array>} Danh sách tin nhắn
   */
  async getChatHistory(user1, user2) {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_CHAT_HISTORY,
        {
          params: { user1, user2 },
          baseURL: COMMUNICATION_SERVICE_URL,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử chat:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử conversation giữa 2 user (sử dụng path parameters)
   * @param {string} userId1 - ID user thứ nhất
   * @param {string} userId2 - ID user thứ hai
   * @returns {Promise<Array>} Danh sách tin nhắn
   */
  async getConversationHistory(userId1, userId2) {
    try {
      const url = API_ENDPOINTS.GET_CONVERSATION_HISTORY.replace(
        "{userId1}",
        userId1
      ).replace("{userId2}", userId2);

      const response = await mainHttpClient.get(url, {
        baseURL: COMMUNICATION_SERVICE_URL,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử conversation:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách conversations của user
   * @param {string} userId - ID của user
   * @returns {Promise<Array>} Danh sách conversations
   */
  async getUserConversations(userId) {
    try {
      const url = API_ENDPOINTS.GET_USER_CONVERSATIONS.replace(
        "{userId}",
        userId
      );
      const response = await mainHttpClient.get(url, {
        baseURL: COMMUNICATION_SERVICE_URL,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách conversations:", error);
      throw error;
    }
  }

  /**
   * Lấy tin nhắn gần đây của user
   * @param {string} userId - ID của user
   * @returns {Promise<Array>} Danh sách tin nhắn gần đây
   */
  async getRecentMessages(userId) {
    try {
      const url = API_ENDPOINTS.GET_RECENT_MESSAGES.replace("{userId}", userId);
      const response = await mainHttpClient.get(url, {
        baseURL: COMMUNICATION_SERVICE_URL,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn gần đây:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử chat cho conversation hiện tại
   * @param {string} currentUserId - ID user hiện tại
   * @param {string} partnerId - ID đối tác chat
   * @returns {Promise<Array>} Danh sách tin nhắn đã format cho UI
   */
  async loadChatHistory(currentUserId, partnerId) {
    try {
      const messages = await this.getConversationHistory(
        currentUserId,
        partnerId
      );

      // Format messages cho UI
      return messages.map((msg) => ({
        id: msg.id,
        sender: msg.senderId === currentUserId ? "You" : `User ${msg.senderId}`,
        time: new Date(msg.timestamp).getTime(),
        text: msg.content,
        mine: msg.senderId === currentUserId,
        read: true, // Mặc định là đã đọc
        timestamp: msg.timestamp,
      }));
    } catch (error) {
      console.error("Lỗi khi load lịch sử chat:", error);
      return [];
    }
  }
}

const chatService = new ChatService();
export default chatService;
