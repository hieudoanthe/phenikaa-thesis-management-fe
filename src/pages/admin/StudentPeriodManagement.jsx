import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import studentAssignmentService from "../../services/studentAssignment.service";
import { API_ENDPOINTS } from "../../config/api";
import { apiGet } from "../../services/mainHttpClient";

const StudentPeriodManagement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [viewType, setViewType] = useState("all"); // "all", "registered", "suggested"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Load danh sách đợt đăng ký
  useEffect(() => {
    loadPeriods();
  }, []);

  // Load sinh viên khi chọn đợt
  useEffect(() => {
    if (selectedPeriod) {
      loadStudentsByPeriod(selectedPeriod.value);
    }
  }, [selectedPeriod, viewType]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      // Gọi API thực tế để lấy danh sách đợt đăng ký
      const response = await apiGet(API_ENDPOINTS.GET_REGISTRATION_PERIODS);

      if (response && Array.isArray(response)) {
        const formattedPeriods = response.map((period) => ({
          value: period.periodId,
          label: `${period.periodName} - ${period.status}`,
        }));
        setPeriods(formattedPeriods);

        if (formattedPeriods.length > 0) {
          setSelectedPeriod(formattedPeriods[0]);
        }
      } else {
        setPeriods([]);
        toast.warning("Không có đợt đăng ký nào");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đợt đăng ký:", error);
      toast.error("Lỗi khi tải danh sách đợt đăng ký");
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsByPeriod = async (periodId) => {
    try {
      setLoading(true);
      let studentsData = [];

      switch (viewType) {
        case "registered":
          studentsData =
            await studentAssignmentService.getRegistrationsByPeriod(periodId);
          break;
        case "suggested":
          studentsData =
            await studentAssignmentService.getSuggestedStudentsByPeriod(
              periodId
            );
          break;
        case "all":
        default:
          studentsData = await studentAssignmentService.getAllStudentsByPeriod(
            periodId
          );
          break;
      }

      // Lấy thông tin profile cho từng sinh viên
      setLoadingProfiles(true);
      const studentsWithProfiles = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const profile = await studentAssignmentService.getStudentProfile(
              student.studentId
            );
            return {
              ...student,
              fullName:
                profile?.fullName ||
                profile?.name ||
                `Sinh viên ${student.studentId}`,
              studentCode:
                profile?.studentCode ||
                profile?.userId ||
                student.studentId.toString(),
              major: profile?.major || "CNTT",
            };
          } catch (error) {
            console.warn(
              `Không thể lấy profile cho sinh viên ${student.studentId}:`,
              error
            );
            return {
              ...student,
              fullName: `Sinh viên ${student.studentId}`,
              studentCode: student.studentId.toString(),
              major: "CNTT",
            };
          }
        })
      );
      setLoadingProfiles(false);

      setStudents(studentsWithProfiles);
      toast.success(`Đã tải ${studentsWithProfiles.length} sinh viên`);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      toast.error("Lỗi khi tải danh sách sinh viên");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (selectedOption) => {
    setSelectedPeriod(selectedOption);
  };

  const handleViewTypeChange = (selectedOption) => {
    setViewType(selectedOption.value);
  };

  const handleRefresh = () => {
    if (selectedPeriod) {
      loadStudentsByPeriod(selectedPeriod.value);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return "Đã duyệt";
      case "PENDING":
        return "Chờ duyệt";
      case "REJECTED":
        return "Từ chối";
      default:
        return "N/A";
    }
  };

  const getRegistrationTypeColor = (type) => {
    switch (type) {
      case "REGISTERED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUGGESTED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRegistrationTypeLabel = (type) => {
    switch (type) {
      case "REGISTERED":
        return "Đăng ký đề tài";
      case "SUGGESTED":
        return "Đề xuất đề tài";
      default:
        return "N/A";
    }
  };

  // Lọc sinh viên theo search query và status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId?.toString().includes(searchQuery) ||
      student.topicCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || student.suggestionStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const viewTypeOptions = [
    { value: "all", label: "Tất cả sinh viên" },
    { value: "registered", label: "Sinh viên đăng ký" },
    { value: "suggested", label: "Sinh viên đề xuất" },
  ];

  const statusFilterOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "REJECTED", label: "Từ chối" },
  ];

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách sinh viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý Sinh viên theo Đợt Đăng ký
              </h1>
              <p className="text-gray-600 mt-2">
                Xem và quản lý danh sách sinh viên đăng ký đề tài theo từng đợt
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || loadingProfiles}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chọn đợt đăng ký */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Đợt Đăng ký
              </label>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                options={periods}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn đợt đăng ký"
                isSearchable={false}
              />
            </div>

            {/* Chọn loại hiển thị */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại Hiển thị
              </label>
              <Select
                value={viewTypeOptions.find(
                  (option) => option.value === viewType
                )}
                onChange={handleViewTypeChange}
                options={viewTypeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn loại hiển thị"
                isSearchable={false}
              />
            </div>

            {/* Lọc theo trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <Select
                value={statusFilterOptions.find(
                  (option) => option.value === filterStatus
                )}
                onChange={(option) => setFilterStatus(option.value)}
                options={statusFilterOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Lọc theo trạng thái"
                isSearchable={false}
              />
            </div>

            {/* Tìm kiếm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên sinh viên, mã SV, tên đề tài, mã đề tài, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống kê</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {students.length}
                  </div>
                  <div className="text-sm text-blue-700">Tổng số sinh viên</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-green-900">
                    {
                      students.filter((s) => s.suggestionStatus === "APPROVED")
                        .length
                    }
                  </div>
                  <div className="text-sm text-green-700">Đã duyệt</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-yellow-900">
                    {
                      students.filter((s) => s.suggestionStatus === "PENDING")
                        .length
                    }
                  </div>
                  <div className="text-sm text-yellow-700">Chờ duyệt</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-red-900">
                    {
                      students.filter((s) => s.suggestionStatus === "REJECTED")
                        .length
                    }
                  </div>
                  <div className="text-sm text-red-700">Từ chối</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Danh sách Sinh viên
              {selectedPeriod && (
                <span className="text-gray-500 font-normal ml-2">
                  - {selectedPeriod.label}
                </span>
              )}
            </h2>
            <div className="text-sm text-gray-600">
              Hiển thị {filteredStudents.length} / {students.length} sinh viên
            </div>
          </div>

          {loadingProfiles ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Đang tải thông tin sinh viên...
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Không có sinh viên nào
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPeriod
                  ? "Không có sinh viên nào trong đợt này."
                  : "Vui lòng chọn một đợt đăng ký."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sinh viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đề tài
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giảng viên HD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {student.studentId}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Mã SV: {student.studentCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              Ngành: {student.major}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {student.topicTitle || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Mã đề tài: {student.topicCode || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Đợt: {student.registrationPeriodId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRegistrationTypeColor(
                            student.registrationType
                          )}`}
                        >
                          {getRegistrationTypeLabel(student.registrationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.suggestionStatus ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                              student.suggestionStatus
                            )}`}
                          >
                            {getStatusLabel(student.suggestionStatus)}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-800 border-gray-200">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            GVHD: {student.supervisorId || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            ID: {student.supervisorId || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Xem chi tiết
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Gán vào lịch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPeriodManagement;
