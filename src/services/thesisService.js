import { apiGet, apiPost, apiPut, apiDelete } from "./httpClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Service xử lý thesis
 */
class ThesisService {
  /**
   * Lấy danh sách thesis
   * @param {Object} params - Tham số tìm kiếm
   * @returns {Promise<Object>} - Danh sách thesis
   */
  async getThesisList(params = {}) {
    try {
      const response = await apiGet(API_ENDPOINTS.THESIS_LIST, { params });
      return {
        success: true,
        data: response,
        message: "Lấy danh sách thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lấy danh sách thesis thất bại",
      };
    }
  }

  /**
   * Lấy chi tiết thesis
   * @param {string} id - ID thesis
   * @returns {Promise<Object>} - Chi tiết thesis
   */
  async getThesisDetail(id) {
    try {
      const response = await apiGet(API_ENDPOINTS.THESIS_DETAIL(id));
      return {
        success: true,
        data: response,
        message: "Lấy chi tiết thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lấy chi tiết thesis thất bại",
      };
    }
  }

  /**
   * Tạo thesis mới
   * @param {Object} thesisData - Dữ liệu thesis
   * @returns {Promise<Object>} - Kết quả tạo thesis
   */
  async createThesis(thesisData) {
    try {
      const response = await apiPost(API_ENDPOINTS.THESIS_CREATE, thesisData);
      return {
        success: true,
        data: response,
        message: "Tạo thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Tạo thesis thất bại",
      };
    }
  }

  /**
   * Cập nhật thesis
   * @param {string} id - ID thesis
   * @param {Object} thesisData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  async updateThesis(id, thesisData) {
    try {
      const response = await apiPut(
        API_ENDPOINTS.THESIS_UPDATE(id),
        thesisData
      );
      return {
        success: true,
        data: response,
        message: "Cập nhật thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Cập nhật thesis thất bại",
      };
    }
  }

  /**
   * Xóa thesis
   * @param {string} id - ID thesis
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteThesis(id) {
    try {
      await apiDelete(API_ENDPOINTS.THESIS_DELETE(id));
      return {
        success: true,
        message: "Xóa thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Xóa thesis thất bại",
      };
    }
  }

  /**
   * Upload file thesis
   * @param {string} id - ID thesis
   * @param {File} file - File cần upload
   * @returns {Promise<Object>} - Kết quả upload
   */
  async uploadThesisFile(id, file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiPost(`/thesis/${id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        data: response,
        message: "Upload file thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Upload file thất bại",
      };
    }
  }

  /**
   * Tìm kiếm thesis
   * @param {Object} searchParams - Tham số tìm kiếm
   * @returns {Promise<Object>} - Kết quả tìm kiếm
   */
  async searchThesis(searchParams) {
    try {
      const response = await apiGet("/thesis/search", { params: searchParams });
      return {
        success: true,
        data: response,
        message: "Tìm kiếm thesis thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Tìm kiếm thesis thất bại",
      };
    }
  }
}

export default new ThesisService();
