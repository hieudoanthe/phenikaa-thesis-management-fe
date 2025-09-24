import { apiPost, apiGet, apiDelete } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class ImportService {
  /**
   * Import sinh viên từ file CSV
   * @param {File} file - File CSV
   * @param {number} periodId - ID đợt đăng ký
   * @param {number} academicYearId - ID năm học
   * @returns {Promise<Object>} - Kết quả import
   */
  async importStudentsFromCSV(file, periodId, academicYearId) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("periodId", periodId);
      formData.append("academicYearId", academicYearId);

      const response = await apiPost(
        API_ENDPOINTS.IMPORT_STUDENTS_CSV,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        success: true,
        data: response,
        message: "Import sinh viên thành công",
      };
    } catch (error) {
      console.error("Lỗi khi import sinh viên:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể import sinh viên",
      };
    }
  }

  /**
   * Lấy danh sách sinh viên theo đợt đăng ký
   * @param {number} periodId - ID đợt đăng ký
   * @returns {Promise<Object>} - Danh sách sinh viên
   */
  async getStudentsByPeriod(periodId) {
    try {
      const endpoint = API_ENDPOINTS.GET_IMPORTED_STUDENTS_BY_PERIOD.replace(
        "{periodId}",
        String(periodId)
      );

      const response = await apiGet(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        message: response.message || "Lấy danh sách sinh viên thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy danh sách sinh viên",
      };
    }
  }

  /**
   * Xóa sinh viên khỏi đợt đăng ký
   * @param {number} studentId - ID sinh viên
   * @param {number} periodId - ID đợt đăng ký
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async removeStudentFromPeriod(studentId, periodId) {
    try {
      const endpoint = API_ENDPOINTS.REMOVE_STUDENT_FROM_PERIOD.replace(
        "{studentId}",
        String(studentId)
      ).replace("{periodId}", String(periodId));

      const response = await apiDelete(endpoint);

      return {
        success: true,
        data: response,
        message: "Xóa sinh viên khỏi đợt đăng ký thành công",
      };
    } catch (error) {
      console.error("Lỗi khi xóa sinh viên khỏi đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể xóa sinh viên khỏi đợt đăng ký",
      };
    }
  }

  /**
   * Tạo template CSV mẫu
   * @returns {string} - Nội dung CSV mẫu
   */
  generateCSVTemplate() {
    const headers = ["Họ và tên", "Username", "Mật khẩu"];

    const sampleData = ["Nguyễn Văn A", "nguyenvana@email.com", "123456"];

    return [headers, sampleData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  /**
   * Download template CSV
   */
  downloadCSVTemplate() {
    const csvContent = this.generateCSVTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "template_sinh_vien.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Tạo template CSV cho sinh viên (alias cho generateCSVTemplate)
   */
  generateStudentCSVTemplate() {
    return this.generateCSVTemplate();
  }

  /**
   * Download template CSV cho sinh viên
   */
  downloadStudentCSVTemplate() {
    return this.downloadCSVTemplate();
  }

  /**
   * Import giảng viên từ CSV
   */
  async importTeachers(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Tăng timeout lên 10 phút
      const response = await apiPost(
        API_ENDPOINTS.IMPORT_TEACHERS_CSV,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 1200000, // 20 phút
        }
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi import giảng viên:", error);

      // Xử lý lỗi timeout cụ thể
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new Error(
          "Import timeout - vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng"
        );
      }

      throw error;
    }
  }

  /**
   * Tạo template CSV cho giảng viên
   */
  generateTeacherCSVTemplate() {
    const headers = ["Họ và tên", "Username", "Mật khẩu"];
    const csvContent = headers.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "mau_giang_vien.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default new ImportService();
