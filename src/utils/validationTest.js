/**
 * Test utility để kiểm tra validation của Defense Session Management
 * File này có thể được sử dụng để test các trường hợp validation
 */

// Mock data để test validation
export const mockSessionData = {
  scheduleId: 1,
  sessionName: "Test Defense Session",
  defenseDate: "2024-01-15",
  startTime: "2024-01-15T09:00:00",
  endTime: "2024-01-15T10:00:00",
  location: "A2-201",
  maxStudents: 5,
  status: "PLANNING",
  committeeMembers: [1, 2, 3], // Mock lecturer IDs
  reviewerMembers: [4], // Mock reviewer ID
};

// Mock error responses từ backend
export const mockValidationErrors = {
  lecturerConflict: {
    response: {
      data: {
        error:
          "Giảng viên ID 1 đã có lịch bảo vệ trong khoảng thời gian này. Vui lòng chọn thời gian khác.",
      },
    },
  },
  roomConflict: {
    response: {
      data: {
        error:
          "Phòng A2-201 đã được sử dụng trong khoảng thời gian này. Vui lòng chọn phòng khác hoặc thời gian khác.",
      },
    },
  },
  multipleLecturerConflict: {
    response: {
      data: {
        error:
          "Giảng viên ID 2 đã có lịch bảo vệ trong khoảng thời gian này. Vui lòng chọn thời gian khác.",
      },
    },
  },
};

// Mock teacher data
export const mockTeachers = [
  { userId: 1, fullName: "Nguyễn Văn A" },
  { userId: 2, fullName: "Trần Thị B" },
  { userId: 3, fullName: "Lê Văn C" },
  { userId: 4, fullName: "Phạm Thị D" },
];

/**
 * Test function để kiểm tra việc xử lý lỗi validation
 */
export const testValidationErrorHandling = (error, teachers) => {
  let msg = "";

  // Xử lý các format lỗi khác nhau từ backend
  if (error.response && error.response.data) {
    if (error.response.data.error) {
      msg = String(error.response.data.error);
    } else if (error.response.data.message) {
      msg = String(error.response.data.message);
    } else if (typeof error.response.data === "string") {
      msg = error.response.data;
    }
  }

  if (msg) {
    // Thay ID -> tên giảng viên nếu bắt được ID
    const idToName = new Map(
      (Array.isArray(teachers) ? teachers : []).map((t) => [
        String(t.userId),
        t.fullName || `Giảng viên ${t.userId}`,
      ])
    );

    // Tìm và thay thế tất cả các pattern "Giảng viên ID X" thành tên thực
    msg = msg.replace(/Giảng viên ID\s+(\d+)/gi, (match, id) => {
      const name = idToName.get(id);
      return name ? `Giảng viên ${name}` : match;
    });
  }

  return msg;
};

/**
 * Test cases để kiểm tra validation
 */
export const testCases = [
  {
    name: "Lecturer Schedule Conflict",
    error: mockValidationErrors.lecturerConflict,
    expected:
      "Giảng viên Nguyễn Văn A đã có lịch bảo vệ trong khoảng thời gian này. Vui lòng chọn thời gian khác.",
  },
  {
    name: "Room Schedule Conflict",
    error: mockValidationErrors.roomConflict,
    expected:
      "Phòng A2-201 đã được sử dụng trong khoảng thời gian này. Vui lòng chọn phòng khác hoặc thời gian khác.",
  },
  {
    name: "Multiple Lecturer Conflict",
    error: mockValidationErrors.multipleLecturerConflict,
    expected:
      "Giảng viên Trần Thị B đã có lịch bảo vệ trong khoảng thời gian này. Vui lòng chọn thời gian khác.",
  },
];

/**
 * Chạy tất cả test cases
 */
export const runValidationTests = () => {
  console.log("🧪 Running Defense Session Validation Tests...");

  testCases.forEach((testCase, index) => {
    const result = testValidationErrorHandling(testCase.error, mockTeachers);
    const passed = result === testCase.expected;

    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Actual: ${result}`);
    console.log(`Status: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log("---");
  });
};

export default {
  mockSessionData,
  mockValidationErrors,
  mockTeachers,
  testValidationErrorHandling,
  testCases,
  runValidationTests,
};
