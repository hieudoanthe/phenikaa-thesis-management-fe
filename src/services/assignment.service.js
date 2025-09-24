import { apiGet, apiPost, apiPut, apiDelete } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class AssignmentService {
  /**
   * Lấy danh sách assignments theo topicId đã được giảng viên xác nhận
   * @param {number} topicId - ID đề tài
   * @returns {Promise<{success:boolean,data:any,message:string,error?:string}>}
   */
  async getAssignmentsByTopic(topicId) {
    try {
      const endpoint = API_ENDPOINTS.GET_ASSIGNMENTS_BY_TOPIC_API.replace(
        "{topicId}",
        String(topicId)
      );

      const response = await apiGet(endpoint);

      return {
        success: true,
        data: response,
        message: "Lấy danh sách assignments thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy assignments theo topic:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy danh sách assignments",
      };
    }
  }

  /**
   * Tạo assignment mới
   * @param {{topicId:number,assignedTo:number,title:string,description:string,dueDate:string,priority:number}} payload
   */
  async createAssignment(payload) {
    try {
      const response = await apiPost(API_ENDPOINTS.CREATE_ASSIGNMENT, payload);
      return {
        success: true,
        data: response,
        message: "Tạo assignment thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo assignment:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể tạo assignment",
      };
    }
  }

  async updateAssignment(assignmentId, payload) {
    try {
      const endpoint = API_ENDPOINTS.UPDATE_ASSIGNMENT.replace(
        "{assignmentId}",
        String(assignmentId)
      );
      const response = await apiPut(endpoint, payload);
      return {
        success: true,
        data: response,
        message: "Cập nhật assignment thành công",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật assignment:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể cập nhật assignment",
      };
    }
  }

  /**
   * Tạo task thuộc assignment
   * @param {number} assignmentId
   * @param {{taskName:string,description?:string,startDate?:string,endDate?:string,priority?:number,status?:number,progress?:number,assignedTo?:number}} payload
   */
  async createTask(assignmentId, payload) {
    try {
      const endpoint = API_ENDPOINTS.CREATE_TASK.replace(
        "{assignmentId}",
        String(assignmentId)
      );
      const response = await apiPost(endpoint, payload);
      return {
        success: true,
        data: response,
        message: "Tạo task thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo task:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể tạo task",
      };
    }
  }

  async updateTask(taskId, payload) {
    try {
      const endpoint = API_ENDPOINTS.UPDATE_TASK.replace(
        "{taskId}",
        String(taskId)
      );
      const response = await apiPut(endpoint, payload);
      return {
        success: true,
        data: response,
        message: "Cập nhật task thành công",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật task:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể cập nhật task",
      };
    }
  }

  async deleteTask(taskId) {
    try {
      const endpoint = API_ENDPOINTS.DELETE_TASK.replace(
        "{taskId}",
        String(taskId)
      );
      const response = await apiDelete(endpoint);
      return { success: true, data: response, message: "Xoá task thành công" };
    } catch (error) {
      console.error("Lỗi khi xoá task:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể xoá task",
      };
    }
  }

  async deleteAssignment(assignmentId) {
    try {
      const endpoint = API_ENDPOINTS.DELETE_ASSIGNMENT.replace(
        "{assignmentId}",
        String(assignmentId)
      );
      const response = await apiDelete(endpoint);
      return {
        success: true,
        data: response,
        message: "Xoá assignment thành công",
      };
    } catch (error) {
      console.error("Lỗi khi xoá assignment:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể xoá assignment",
      };
    }
  }
}

export default new AssignmentService();
