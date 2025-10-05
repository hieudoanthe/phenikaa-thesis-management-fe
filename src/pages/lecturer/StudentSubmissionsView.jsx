import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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

const StudentSubmissionsView = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingView, setLoadingView] = useState(null);
  const [loadingDownload, setLoadingDownload] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [currentViewingSubmissionId, setCurrentViewingSubmissionId] =
    useState(null);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSubmissionForFeedback, setSelectedSubmissionForFeedback] =
    useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    content: "",
    feedbackType: 1, // Default to COMMENT type
  });
  const [filters, setFilters] = useState({
    status: "",
    submissionType: "",
    search: "",
  });

  // Ref để tránh gọi API nhiều lần
  const loadingRef = useRef(false);
  const lastToastRef = useRef(0);

  // React-Select options
  const statusOptions = [
    { value: "1", label: "Đã nộp" },
    { value: "2", label: "Đang xem xét" },
    { value: "3", label: "Đã duyệt" },
    { value: "4", label: "Từ chối" },
  ];

  const submissionTypeOptions = [
    { value: "", label: "Tất cả loại" },
    { value: "1", label: "Báo cáo tiến độ" },
    { value: "2", label: "Báo cáo KLTN" },
    { value: "3", label: "Báo cáo khác" },
  ];

  const selectTheme = (theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#ff6600",
      primary25: "#ffe0cc",
      primary50: "#ffb380",
    },
  });

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : base.boxShadow,
      "&:hover": {
        borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#ff6600"
        : state.isFocused
        ? "#ffe0cc"
        : base.backgroundColor,
      color: state.isSelected ? "#fff" : base.color,
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#ff6600" : base.color,
      "&:hover": { color: "#ff6600" },
    }),
  };

  useEffect(() => {
    loadSubmissions();
  }, [currentPage, filters.status, filters.submissionType, filters.search]);

  const loadSubmissions = async () => {
    // Tránh gọi API nhiều lần cùng lúc
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      const response = await submissionService.getSubmissionsWithPagination(
        currentPage,
        10
      );
      setSubmissions(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Error loading submissions:", error);
      // Debounce toast để tránh hiển thị nhiều lần
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        showToast("Lỗi khi tải danh sách báo cáo", "error");
        lastToastRef.current = now;
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
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

  // Helper function để lấy icon file
  const getFileIcon = (filePath) => {
    if (!filePath) {
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
            <path d="M5.523 10.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 4.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.28a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.45z" />
            <path
              fillRule="evenodd"
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

  // Helper function để lấy text trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "Đã nộp";
      case 2:
        return "Đang xem xét";
      case 3:
        return "Đã duyệt";
      case 4:
        return "Từ chối";
      default:
        return "Không xác định";
    }
  };

  // Helper function để lấy badge trạng thái
  const getStatusBadge = (status) => {
    const statusText = getStatusText(status);
    let className = "px-2 py-1 rounded-full text-xs font-medium ";

    switch (status) {
      case 1:
        className += "bg-blue-100 text-blue-800";
        break;
      case 2:
        className += "bg-yellow-100 text-yellow-800";
        break;
      case 3:
        className += "bg-green-100 text-green-800";
        break;
      case 4:
        className += "bg-red-100 text-red-800";
        break;
      default:
        className += "bg-gray-100 text-gray-800";
    }

    return <span className={className}>{statusText}</span>;
  };

  // Helper function để lấy text loại báo cáo
  const getSubmissionTypeText = (type) => {
    switch (type) {
      case 1:
        return "Báo cáo tiến độ";
      case 2:
        return "Báo cáo KLTN";
      case 3:
        return "Báo cáo khác";
      default:
        return "Không xác định";
    }
  };

  // Helper function để xử lý click vào file (xem trực tiếp)
  const handleFileClick = async (submissionId, filePath) => {
    if (!filePath) return;

    try {
      setLoadingView(submissionId);
      const previewData = await submissionService.previewFile(submissionId);

      setFileUrl(previewData.url);
      setFileName(getFileName(filePath));
      setFileType(previewData.type);
      setCurrentViewingSubmissionId(submissionId);
      setShowFileModal(true);
    } catch (error) {
      console.error("Error loading file:", error);
      showToast("Lỗi khi tải file", "error");
    } finally {
      setLoadingView(null);
    }
  };

  // Helper function để download file
  const handleDownloadFile = async (submissionId, filePath) => {
    if (!filePath) return;

    try {
      setLoadingDownload(submissionId);
      const response = await submissionService.downloadFile(submissionId);

      const blob = new Blob([response], {
        type: response.type || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName(filePath);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("File đã được tải về", "success");
    } catch (error) {
      console.error("Error downloading file:", error);
      showToast("Lỗi khi tải file", "error");
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

  // Feedback functions
  const handleCreateFeedback = (submission) => {
    setSelectedSubmissionForFeedback(submission);
    setFeedbackForm({
      content: "",
      feedbackType: 1, // Default to COMMENT type
    });
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.content.trim()) {
      showToast("Vui lòng nhập nội dung phản hồi", "error");
      return;
    }

    try {
      const feedbackData = {
        submissionId: selectedSubmissionForFeedback.submissionId,
        content: feedbackForm.content,
        feedbackType: feedbackForm.feedbackType,
        reviewerId: getUserIdFromToken(),
      };

      await submissionService.createFeedback(feedbackData);
      showToast("Phản hồi đã được tạo thành công", "success");
      setShowFeedbackModal(false);
      setSelectedSubmissionForFeedback(null);
      setFeedbackForm({ content: "", feedbackType: 1 });
    } catch (error) {
      console.error("Error creating feedback:", error);
      showToast("Lỗi khi tạo phản hồi", "error");
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedSubmissionForFeedback(null);
    setFeedbackForm({ content: "", feedbackType: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="typeSelect"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Loại báo cáo
              </label>
              <Select
                inputId="typeSelect"
                classNamePrefix="rs"
                options={submissionTypeOptions}
                value={submissionTypeOptions.find(
                  (o) => o.value === String(filters.submissionType)
                )}
                onChange={(opt) =>
                  setFilters({
                    ...filters,
                    submissionType: opt ? opt.value : "",
                  })
                }
                isClearable={false}
                theme={selectTheme}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Tìm kiếm theo tiêu đề..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: "", submissionType: "", search: "" });
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Submissions - Mobile Cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">
                Đang tải danh sách báo cáo...
              </p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Chưa có báo cáo nào
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {submission.reportTitle || "Không có tiêu đề"}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        Sinh viên:{" "}
                        {submission.studentName ||
                          submission.fullName ||
                          "Sinh viên"}
                      </p>
                    </div>
                    <div>{getStatusBadge(submission.status)}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-500">Loại:</span>
                      <span className="ml-1 font-medium">
                        {getSubmissionTypeText(submission.submissionType)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">Ngày nộp:</span>
                      <span className="ml-1 font-medium">
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {submission.filePath ? (
                      <>
                        <button
                          onClick={() =>
                            handleFileClick(
                              submission.submissionId,
                              submission.filePath
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 px-2 py-1 rounded"
                        >
                          <span>{getFileIcon(submission.filePath)}</span>
                          <span>Xem</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadFile(
                              submission.submissionId,
                              submission.filePath
                            )
                          }
                          className="text-green-600 hover:text-green-800 underline flex items-center gap-1 px-2 py-1 rounded"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-cloud-arrow-down-fill inline mr-1"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                          </svg>
                          <span>Tải về</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400">Không có file</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleCreateFeedback(submission)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Phản hồi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submissions Table (Desktop) */}
        <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có báo cáo nào
              </h3>
              <p className="text-gray-600">
                Sinh viên chưa nộp báo cáo nào hoặc không có báo cáo phù hợp với
                bộ lọc.
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
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại báo cáo
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
                  {submissions.map((submission) => (
                    <tr
                      key={submission.submissionId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.studentName ||
                            submission.fullName ||
                            "Sinh viên"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {submission.reportTitle || "Không có tiêu đề"}
                        </div>
                        {submission.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {submission.description.length > 100
                              ? `${submission.description.substring(0, 100)}...`
                              : submission.description}
                          </div>
                        )}
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
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
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
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCreateFeedback(submission)}
                          className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
                          </svg>
                          Phản hồi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage + 1}</span>{" "}
                    / <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(0, currentPage - 1))
                      }
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(totalPages - 1, currentPage + 1)
                        )
                      }
                      disabled={currentPage === totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

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
                          }
                        }
                      } catch (error) {
                        console.error("Error downloading file:", error);
                        showToast("Lỗi khi tải file", "error");
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-cloud-arrow-down-fill inline mr-1"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                    </svg>
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
                            "Không thể hiển thị hình ảnh này. Vui lòng tải về để xem.",
                            "error"
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
                      />
                    ) : fileType === "application/msword" ||
                      fileType ===
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                      fileType === "application/vnd.ms-powerpoint" ||
                      fileType ===
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
                      fileType === "application/vnd.ms-excel" ||
                      fileType ===
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center p-8">
                          <div className="text-6xl mb-4">📄</div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            File Office: {fileName}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Loại file: {fileType}
                          </p>
                          <p className="text-gray-600 mb-6">
                            File Word, PowerPoint, Excel không thể hiển thị trực
                            tiếp trong trình duyệt. Vui lòng tải về để xem bằng
                            ứng dụng phù hợp.
                          </p>
                          <div className="flex gap-4 justify-center">
                            <button
                              onClick={() => {
                                window.open(fileUrl, "_blank");
                              }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              🔗 Mở trong tab mới
                            </button>
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
                                  console.error(
                                    "Error downloading file:",
                                    error
                                  );
                                  showToast("Lỗi khi tải file", "error");
                                }
                              }}
                              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="bi bi-cloud-arrow-down-fill inline mr-1"
                                viewBox="0 0 16 16"
                              >
                                <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                              </svg>
                              Tải về để xem
                            </button>
                          </div>
                        </div>
                      </div>
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
                            File này không thể hiển thị trực tiếp. Vui lòng tải
                            về để xem.
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
                                showToast("Lỗi khi tải file", "error");
                              }
                            }}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            📥 Tải về để xem
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

        {/* Feedback Modal */}
        {showFeedbackModal && selectedSubmissionForFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tạo phản hồi cho báo cáo
                </h3>
                <button
                  onClick={closeFeedbackModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Thông tin báo cáo:
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Tiêu đề:</span>{" "}
                      {selectedSubmissionForFeedback.title}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Sinh viên:</span>{" "}
                      {selectedSubmissionForFeedback.studentName ||
                        selectedSubmissionForFeedback.fullName ||
                        "N/A"}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Loại báo cáo:</span>{" "}
                      {getSubmissionTypeText(
                        selectedSubmissionForFeedback.submissionType
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="feedbackContent"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nội dung phản hồi *
                    </label>
                    <textarea
                      id="feedbackContent"
                      value={feedbackForm.content}
                      onChange={(e) =>
                        setFeedbackForm({
                          ...feedbackForm,
                          content: e.target.value,
                        })
                      }
                      placeholder="Nhập nội dung phản hồi chi tiết..."
                      rows={6}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={closeFeedbackModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 border border-transparent rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Tạo phản hồi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissionsView;
