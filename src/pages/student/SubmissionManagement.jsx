import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};
import * as submissionService from "../../services/submission.service";
import { getUserIdFromToken } from "../../auth/authUtils";
import ConfirmModal from "../../components/modals/ConfirmModal";
import Select from "react-select";

const SubmissionManagement = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingFile, setLoadingFile] = useState(null); // Track which file is loading
  const [loadingView, setLoadingView] = useState(null); // Track which file is being viewed
  const [loadingDownload, setLoadingDownload] = useState(null); // Track which file is being downloaded
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [currentViewingSubmissionId, setCurrentViewingSubmissionId] =
    useState(null);
  const [filters, setFilters] = useState({
    submissionType: "",
    search: "",
  });

  // State cho danh sách đề tài
  const [confirmedTopics, setConfirmedTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    topicId: "",
    reportTitle: "",
    description: "",
    submissionType: 1,
    deadline: "",
    file: null,
    submittedBy: null, // Sẽ được set từ token
  });

  useEffect(() => {
    loadSubmissions();
    loadConfirmedTopics();
  }, [currentPage, filters]);

  // Đọc query params để prefill topicId và tự mở modal tạo mới nếu có yêu cầu
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const topicId = params.get("topicId");
      const openCreate = params.get("openCreate");
      if (topicId) {
        setFormData((prev) => ({ ...prev, topicId }));
      }
      if (openCreate === "1") {
        setShowCreateModal(true);
      }
    } catch (e) {
      // noop
    }
  }, []);

  // State để kiểm soát việc hiển thị toast lỗi
  const [hasShownError, setHasShownError] = useState(false);

  // Options cho react-select
  // Bỏ filter theo trạng thái theo yêu cầu

  const submissionTypeOptions = [
    { value: "", label: "Tất cả loại" },
    { value: "1", label: "Báo cáo tiến độ" },
    { value: "2", label: "Báo cáo cuối kỳ" },
    { value: "3", label: "Báo cáo khác" },
  ];

  // Custom styles cho react-select
  const customSelectStyles = {
    container: (provided) => ({
      ...provided,
      width: 180,
      display: "inline-block",
    }),
    control: (provided, state) => ({
      ...provided,
      minHeight: "42px",
      borderColor: state.isFocused ? "#ea580c" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #ea580c" : "none",
      "&:hover": {
        borderColor: "#ea580c",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#ea580c"
        : state.isFocused
        ? "#fed7aa"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#ea580c" : "#fed7aa",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setHasShownError(false); // Reset error state
      const response = await submissionService.filterSubmissions({
        search: filters.search || null,
        submissionType: filters.submissionType
          ? Number(filters.submissionType)
          : null,
        page: currentPage,
        size: 10,
      });
      setSubmissions(response?.content || []);
      setTotalPages(response?.totalPages || 0);
    } catch (error) {
      console.error("Error loading submissions:", error);
      if (!hasShownError) {
        setHasShownError(true);
        showToast("Lỗi khi tải dữ liệu");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConfirmedTopics = async () => {
    try {
      setLoadingTopics(true);
      const studentId = getUserIdFromToken();
      if (studentId) {
        const topics = await submissionService.getStudentConfirmedTopics(
          studentId
        );
        setConfirmedTopics(topics);
      }
    } catch (error) {
      console.error("Error loading confirmed topics:", error);
      if (!hasShownError) {
        setHasShownError(true);
        showToast("Lỗi khi tải dữ liệu");
      }
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Set submittedBy từ token
      const studentId = getUserIdFromToken();
      const submissionData = {
        ...formData,
        submittedBy: studentId,
      };

      await submissionService.createSubmission(submissionData);
      showToast("Tạo báo cáo thành công");
      setShowCreateModal(false);
      resetForm();
      loadSubmissions();
    } catch (error) {
      console.error("Error creating submission:", error);
      showToast("Lỗi khi tạo báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Set submittedBy từ token
      const studentId = getUserIdFromToken();
      const submissionData = {
        ...formData,
        submittedBy: studentId,
      };

      await submissionService.updateSubmission(
        selectedSubmission.submissionId,
        submissionData
      );
      showToast("Cập nhật báo cáo thành công");
      setShowEditModal(false);
      resetForm();
      loadSubmissions();
    } catch (error) {
      console.error("Error updating submission:", error);
      showToast("Lỗi khi cập nhật báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = (submissionId) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
      setLoading(true);
      await submissionService.deleteSubmission(submissionToDelete);
      showToast("Xóa báo cáo thành công");
      loadSubmissions();
      setShowDeleteModal(false);
      setSubmissionToDelete(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
      showToast("Lỗi khi xóa báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteSubmission = () => {
    setShowDeleteModal(false);
    setSubmissionToDelete(null);
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      setLoading(true);
      await submissionService.updateSubmissionStatus(submissionId, newStatus);
      showToast("Cập nhật trạng thái thành công");
      loadSubmissions();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      topicId: "",
      reportTitle: "",
      description: "",
      submissionType: 1,
      deadline: "",
      file: null,
    });
  };

  const openEditModal = (submission) => {
    setSelectedSubmission(submission);
    setFormData({
      topicId: submission.topicId,
      reportTitle: submission.reportTitle,
      description: submission.description,
      submissionType: submission.submissionType,
      deadline: submission.deadline,
      file: null,
    });
    setShowEditModal(true);
    // Load lại danh sách đề tài khi mở modal edit
    loadConfirmedTopics();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      1: { text: "Đã nộp", color: "bg-blue-100 text-blue-800" },
      2: { text: "Đang xem xét", color: "bg-yellow-100 text-yellow-800" },
      3: { text: "Đã duyệt", color: "bg-green-100 text-green-800" },
      4: { text: "Từ chối", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || {
      text: "Không xác định",
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}
      >
        {statusInfo.text}
      </span>
    );
  };

  const getSubmissionTypeText = (type) => {
    const typeMap = {
      1: "Báo cáo tiến độ",
      2: "Báo cáo cuối kỳ",
      3: "Báo cáo khác",
    };
    return typeMap[type] || "Không xác định";
  };

  const getTopicInfo = (topicId) => {
    const topic = confirmedTopics.find((t) => t.topicId === topicId);
    if (topic) {
      return {
        title: topic.topicTitle || `Đề tài ${topicId}`,
        code: topic.topicCode || `Mã ${topicId}`,
      };
    }
    return {
      title: `Đề tài ${topicId}`,
      code: `Mã ${topicId}`,
    };
  };

  // Helper function để lấy icon cho từng loại file
  const getFileIcon = (filePath) => {
    if (!filePath) return "📄";

    const extension = filePath.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-file-pdf-fill"
            viewBox="0 0 16 16"
          >
            <path d="M5.523 10.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 4.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z" />
            <path
              fill-rule="evenodd"
              d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m.165 11.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.6 11.6 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"
            />
          </svg>
        );
      case "doc":
      case "docx":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-file-earmark-word-fill"
            viewBox="0 0 16 16"
          >
            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.485 6.879l1.036 4.144.997-3.655a.5.5 0 0 1 .964 0l.997 3.655 1.036-4.144a.5.5 0 0 1 .97.242l-1.5 6a.5.5 0 0 1-.967.01L8 9.402l-1.018 3.73a.5.5 0 0 1-.967-.01l-1.5-6a.5.5 0 1 1 .97-.242z" />
          </svg>
        );
      case "xls":
      case "xlsx":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-file-earmark-excel-fill"
            viewBox="0 0 16 16"
          >
            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.884 6.68 8 9.219l2.116-2.54a.5.5 0 1 1 .768.641L8.651 10l2.233 2.68a.5.5 0 0 1-.768.64L8 10.781l-2.116 2.54a.5.5 0 0 1-.768-.641L7.349 10 5.116 7.32a.5.5 0 1 1 .768-.64" />
          </svg>
        );
      case "ppt":
      case "pptx":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-file-ppt-fill"
            viewBox="0 0 16 16"
          >
            <path d="M8.188 8.5H7V5h1.188a1.75 1.75 0 1 1 0 3.5" />
            <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m3 4a1 1 0 0 0-1 1v6.5a.5.5 0 0 0 1 0v-2h1.188a2.75 2.75 0 0 0 0-5.5z" />
          </svg>
        );
      case "zip":
      case "rar":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-file-earmark-zip-fill"
            viewBox="0 0 16 16"
          >
            <path d="M5.5 9.438V8.5h1v.938a1 1 0 0 0 .03.243l.4 1.598-.93.62-.93-.62.4-1.598a1 1 0 0 0 .03-.243" />
            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1m-4-.5V2h-1V1H6v1h1v1H6v1h1v1H6v1h1v1H5.5V6h-1V5h1V4h-1V3zm0 4.5h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 1-.415-1.074l.4-1.599V8.5a1 1 0 0 1 1-1" />
          </svg>
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-files-alt"
            viewBox="0 0 16 16"
          >
            <path d="M11 0H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2 2 2 0 0 0 2-2V4a2 2 0 0 0-2-2 2 2 0 0 0-2-2m2 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1zM2 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-patch-question-fill"
            viewBox="0 0 16 16"
          >
            <path d="M5.933.87a2.89 2.89 0 0 1 4.134 0l.622.638.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01zM7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0m1.602-2.027c.04-.534.198-.815.846-1.26.674-.475 1.05-1.09 1.05-1.986 0-1.325-.92-2.227-2.262-2.227-1.02 0-1.792.492-2.1 1.29A1.7 1.7 0 0 0 6 5.48c0 .393.203.64.545.64.272 0 .455-.147.564-.51.158-.592.525-.915 1.074-.915.61 0 1.03.446 1.03 1.084 0 .563-.208.885-.822 1.325-.619.433-.926.914-.926 1.64v.111c0 .428.208.745.585.745.336 0 .504-.24.554-.627" />
          </svg>
        );
    }
  };

  // Helper function để lấy tên file từ URL
  const getFileName = (filePath) => {
    if (!filePath) return "Không có file";

    try {
      const url = new URL(filePath);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      return fileName || "File";
    } catch (error) {
      return "File";
    }
  };

  // Helper function để xử lý click vào file (xem trực tiếp)
  const handleFileClick = async (submissionId, filePath) => {
    if (!filePath) return;

    try {
      setLoadingView(submissionId);
      // Sử dụng service preview để xem file thay vì download
      const previewData = await submissionService.previewFile(submissionId);

      // Hiển thị file trong modal
      setFileUrl(previewData.url);
      setFileName(getFileName(filePath));
      setFileType(previewData.type);
      setCurrentViewingSubmissionId(submissionId);
      setShowFileModal(true);
    } catch (error) {
      console.error("Error loading file:", error);
      showToast("Lỗi khi tải file");
    } finally {
      setLoadingView(null);
    }
  };

  // Helper function để download file
  const handleDownloadFile = async (submissionId, filePath) => {
    if (!filePath) return;

    try {
      setLoadingDownload(submissionId);
      // Sử dụng axios để lấy file với authentication
      const response = await submissionService.downloadFile(submissionId);

      // Tạo blob từ response data
      const blob = new Blob([response], {
        type: response.type || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);

      // Tạo link để download
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName(filePath);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("File đã được tải về");
    } catch (error) {
      console.error("Error downloading file:", error);
      showToast("Lỗi khi tải file");
    } finally {
      setLoadingDownload(null);
    }
  };

  // Helper function để đóng file modal và cleanup
  const closeFileModal = () => {
    if (fileUrl) {
      window.URL.revokeObjectURL(fileUrl);
    }
    setShowFileModal(false);
    setFileUrl(null);
    setFileName("");
    setFileType("");
    setCurrentViewingSubmissionId(null);
  };

  return (
    <div className="w-full">
      {/* Confirmed Topics Info */}
      {!loadingTopics && confirmedTopics.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Chưa có đề tài nào được xác nhận
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Bạn cần có ít nhất một đề tài đã được duyệt để có thể tạo báo
                  cáo. Hãy đề xuất đề tài và chờ giảng viên duyệt trước.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={() =>
                      (window.location.href = "/student/topic-registration")
                    }
                    className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  >
                    Đề xuất đề tài ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại báo cáo
            </label>
            <Select
              value={submissionTypeOptions.find(
                (option) => option.value === filters.submissionType
              )}
              onChange={(selectedOption) =>
                setFilters({
                  ...filters,
                  submissionType: selectedOption?.value || "",
                })
              }
              options={submissionTypeOptions}
              styles={customSelectStyles}
              placeholder="Chọn loại báo cáo"
              isSearchable
              className="text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-400"
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Tìm kiếm theo tiêu đề..."
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end justify-end shrink-0 md:ml-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!loadingTopics && confirmedTopics.length === 0}
              className="w-auto text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, #ea580c 100%, #fb923c 100%)",
              }}
            >
              Tạo báo cáo mới
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đề tài
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày nộp
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">
                      Đang tải danh sách báo cáo...
                    </p>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không có báo cáo nào
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => {
                  const topicInfo = getTopicInfo(submission.topicId);
                  return (
                    <tr
                      key={submission.submissionId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.reportTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.description?.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {topicInfo.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {topicInfo.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getSubmissionTypeText(submission.submissionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.filePath ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleFileClick(
                                  submission.submissionId,
                                  submission.filePath
                                )
                              }
                              disabled={loadingView === submission.submissionId}
                              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingView === submission.submissionId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                              ) : (
                                <span>{getFileIcon(submission.filePath)}</span>
                              )}
                              <span>Xem</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadFile(
                                  submission.submissionId,
                                  submission.filePath
                                )
                              }
                              disabled={
                                loadingDownload === submission.submissionId
                              }
                              className="text-green-600 hover:text-green-800 underline flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingDownload === submission.submissionId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  className="bi bi-cloud-arrow-down-fill"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                                </svg>
                              )}
                              <span>Tải về</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Không có file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(submission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteSubmission(submission.submissionId)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Trang <span className="font-medium">{currentPage + 1}</span>{" "}
                  của <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 m-0">
                  Tạo báo cáo mới
                </h3>
              </div>
              <form onSubmit={handleCreateSubmission}>
                <div className="mb-4 relative">
                  <select
                    id="create-topicId"
                    value={formData.topicId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        topicId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    required
                    disabled={loadingTopics}
                  >
                    <option value="">
                      {loadingTopics ? "Đang tải..." : "Chọn đề tài"}
                    </option>
                    {confirmedTopics.map((topic) => (
                      <option key={topic.topicId} value={topic.topicId}>
                        {topic.topicTitle || `Đề tài ${topic.topicId}`} -{" "}
                        {topic.topicCode || `Mã ${topic.topicId}`}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="create-topicId"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Chọn đề tài <span className="text-red-500">*</span>
                  </label>
                  {confirmedTopics.length === 0 && !loadingTopics && (
                    <p className="text-sm text-red-600 mt-1">
                      Bạn chưa có đề tài nào được xác nhận
                    </p>
                  )}
                </div>
                <div className="mb-4 relative">
                  <input
                    id="create-title"
                    type="text"
                    placeholder=" "
                    value={formData.reportTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reportTitle: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    required
                  />
                  <label
                    htmlFor="create-title"
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm"
                  >
                    Tiêu đề báo cáo <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="mb-4 relative">
                  <textarea
                    id="create-desc"
                    placeholder=" "
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    rows="3"
                  />
                  <label
                    htmlFor="create-desc"
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm"
                  >
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="mb-4 relative">
                  <select
                    id="create-type"
                    value={formData.submissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        submissionType: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                  >
                    <option value={1}>Báo cáo tiến độ</option>
                    <option value={2}>Báo cáo cuối kỳ</option>
                    <option value={3}>Báo cáo khác</option>
                  </select>
                  <label
                    htmlFor="create-type"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Loại báo cáo <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="mb-4 relative">
                  <input
                    id="create-file"
                    type="file"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files[0] })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="create-file"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    File đính kèm <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR, JPG,
                    PNG, GIF (Tối đa 50MB)
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 transition-all duration-300 hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
                    }}
                  >
                    {loading ? "Đang tạo..." : "Tạo báo cáo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chỉnh sửa báo cáo
              </h3>
              <form onSubmit={handleUpdateSubmission}>
                <div className="mb-4 relative">
                  <select
                    id="edit-topicId"
                    value={formData.topicId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        topicId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    required
                    disabled={loadingTopics}
                  >
                    <option value="">
                      {loadingTopics ? "Đang tải..." : "Chọn đề tài"}
                    </option>
                    {confirmedTopics.map((topic) => (
                      <option key={topic.topicId} value={topic.topicId}>
                        {topic.topicTitle || `Đề tài ${topic.topicId}`} -{" "}
                        {topic.topicCode || `Mã ${topic.topicId}`}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="edit-topicId"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Chọn đề tài
                  </label>
                  {confirmedTopics.length === 0 && !loadingTopics && (
                    <p className="text-sm text-red-600 mt-1">
                      Bạn chưa có đề tài nào được xác nhận
                    </p>
                  )}
                </div>
                <div className="mb-4 relative">
                  <input
                    id="edit-title"
                    type="text"
                    value={formData.reportTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reportTitle: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    required
                  />
                  <label
                    htmlFor="edit-title"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Tiêu đề báo cáo
                  </label>
                </div>
                <div className="mb-4 relative">
                  <textarea
                    id="edit-desc"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    rows="3"
                  />
                  <label
                    htmlFor="edit-desc"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Mô tả
                  </label>
                </div>
                <div className="mb-4 relative">
                  <select
                    id="edit-type"
                    value={formData.submissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        submissionType: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                  >
                    <option value={1}>Báo cáo tiến độ</option>
                    <option value={2}>Báo cáo cuối kỳ</option>
                    <option value={3}>Báo cáo khác</option>
                  </select>
                  <label
                    htmlFor="edit-type"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    Loại báo cáo
                  </label>
                </div>
                <div className="mb-4 relative">
                  <input
                    id="edit-file"
                    type="file"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files[0] })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="edit-file"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    File đính kèm mới (tùy chọn)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR, JPG,
                    PNG, GIF (Tối đa 50MB)
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 transition-all duration-300 hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
                    }}
                  >
                    {loading ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* File View Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Xem file: {fileName}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      if (currentViewingSubmissionId) {
                        const currentSubmission = submissions.find(
                          (sub) =>
                            sub.submissionId === currentViewingSubmissionId
                        );
                        if (currentSubmission) {
                          await handleDownloadFile(
                            currentViewingSubmissionId,
                            currentSubmission.filePath
                          );
                        } else {
                          showToast(
                            "Không thể tìm thấy thông tin file để tải về"
                          );
                        }
                      } else {
                        showToast(
                          "Không thể tìm thấy thông tin file để tải về"
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Error downloading file from modal:",
                        error
                      );
                      showToast("Lỗi khi tải file");
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-cloud-arrow-down-fill"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                  </svg>{" "}
                  Tải về
                </button>
                <button
                  onClick={closeFileModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>
            <div
              className="border rounded-lg overflow-hidden"
              style={{ height: "80vh" }}
            >
              {fileUrl && (
                <div className="w-full h-full">
                  {fileType.startsWith("image/") ? (
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="w-full h-full object-contain"
                      style={{
                        border: "none",
                        width: "100%",
                        height: "100%",
                      }}
                      onError={() => {
                        console.log("Error loading image");
                        showToast(
                          "Không thể hiển thị hình ảnh này. Vui lòng tải về để xem."
                        );
                      }}
                    />
                  ) : fileType === "application/pdf" ? (
                    <embed
                      src={fileUrl}
                      type="application/pdf"
                      className="w-full h-full"
                      style={{
                        border: "none",
                        width: "100%",
                        height: "100%",
                      }}
                      onError={() => {
                        console.log("Error loading PDF");
                        showToast(
                          "Không thể hiển thị PDF này. Vui lòng tải về để xem."
                        );
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          File: {fileName}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Loại file: {fileType}
                        </p>
                        <p className="text-gray-600 mb-6">
                          File này không thể hiển thị trực tiếp. Vui lòng tải về
                          để xem.
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              if (currentViewingSubmissionId) {
                                const currentSubmission = submissions.find(
                                  (sub) =>
                                    sub.submissionId ===
                                    currentViewingSubmissionId
                                );
                                if (currentSubmission) {
                                  await handleDownloadFile(
                                    currentViewingSubmissionId,
                                    currentSubmission.filePath
                                  );
                                }
                              }
                            } catch (error) {
                              console.error("Error downloading file:", error);
                              showToast("Lỗi khi tải file");
                            }
                          }}
                          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-cloud-arrow-down-fill"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                          </svg>{" "}
                          Tải về để xem
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa báo cáo"
        message="Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        onConfirm={confirmDeleteSubmission}
        onCancel={cancelDeleteSubmission}
        loading={loading}
      />
    </div>
  );
};

export default SubmissionManagement;

