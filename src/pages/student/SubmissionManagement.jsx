import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toastHelper";
import * as submissionService from "../../services/submission.service";
import { getUserIdFromToken } from "../../auth/authUtils";
import ConfirmModal from "../../components/modals/ConfirmModal";
import Select from "react-select";
import { useTranslation } from "react-i18next";

const SubmissionManagement = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
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

  // Re-load submissions when confirmed topics change to ensure filtering is applied
  useEffect(() => {
    loadSubmissions();
  }, [confirmedTopics]);

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
    { value: "", label: t("submission.filters.allTypes") },
    { value: "1", label: t("submission.filters.progress") },
    { value: "2", label: t("submission.filters.final") },
    { value: "3", label: t("submission.filters.other") },
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

  // Helper to resolve topic title/code like MyThesis.jsx
  const getTopicInfo = (topicId) => {
    const topic = confirmedTopics.find(
      (t) => String(t.topicId) === String(topicId)
    );
    return {
      title: topic?.topicTitle || topic?.title || `Đề tài ${topicId}`,
      code: topic?.topicCode || topic?.code || `Mã ${topicId}`,
    };
  };

  // Helper: truncate by words and keep full in title tooltip
  const truncateWords = (text, maxWords) => {
    if (!text) return "";
    const words = String(text).trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "…";
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
      const raw = response?.content || [];
      // Current user id
      const studentId = getUserIdFromToken();
      // First filter by owner (submittedBy)
      const ownOnly = raw.filter(
        (s) => String(s.submittedBy) === String(studentId)
      );
      // If we have confirmed topics, only show submissions whose topicId is in student's confirmed topics
      if (confirmedTopics && confirmedTopics.length > 0) {
        const allowed = new Set(confirmedTopics.map((t) => String(t.topicId)));
        const filtered = ownOnly.filter((s) => allowed.has(String(s.topicId)));
        setSubmissions(filtered);
      } else {
        setSubmissions(ownOnly);
      }
      setTotalPages(response?.totalPages || 0);
    } catch (error) {
      console.error("Error loading submissions:", error);
      if (!hasShownError) {
        setHasShownError(true);
        showToast(t("submission.toasts.loadError"), "error");
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
        showToast(t("submission.toasts.loadError"), "error");
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
      showToast(t("submission.toasts.createSuccess"));
      setShowCreateModal(false);
      resetForm();
      loadSubmissions();
    } catch (error) {
      console.error("Error creating submission:", error);
      if (
        error.response?.status === 413 ||
        error.response?.data?.error === "PAYLOAD_TOO_LARGE"
      ) {
        showToast("File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.", "error");
      } else {
        showToast(t("submission.toasts.loadError"), "error");
      }
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
        topicId: formData.topicId,
        reportTitle: formData.reportTitle,
        description: formData.description,
        submissionType: formData.submissionType,
        submittedBy: studentId,
        file: formData.file,
        // Only include deadline if it has a value
        ...(formData.deadline && { deadline: formData.deadline }),
      };

      await submissionService.updateSubmission(
        selectedSubmission.submissionId,
        submissionData
      );
      showToast(t("submission.toasts.createSuccess"));
      setShowEditModal(false);
      resetForm();
      loadSubmissions();
    } catch (error) {
      console.error("Error updating submission:", error);
      if (
        error.response?.status === 413 ||
        error.response?.data?.error === "PAYLOAD_TOO_LARGE"
      ) {
        showToast("File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.", "error");
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.error === "VALIDATION_ERROR"
      ) {
        const fieldErrors = error.response?.data?.fieldErrors;
        if (fieldErrors?.deadline) {
          showToast("Deadline không hợp lệ: " + fieldErrors.deadline, "error");
        } else {
          showToast("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", "error");
        }
      } else {
        showToast(t("submission.toasts.loadError"), "error");
      }
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
      showToast(t("submission.toasts.loadError"), "error");
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
      showToast(t("submission.toasts.loadError"), "error");
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
      deadline: submission.deadline || "", // Ensure deadline is not null
      file: null,
    });
    setShowEditModal(true);
    // Load lại danh sách đề tài khi mở modal edit
    loadConfirmedTopics();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      1: {
        text: t("submission.status.submitted"),
        color: "bg-blue-100 text-blue-800",
      },
      2: {
        text: t("submission.status.reviewing"),
        color: "bg-yellow-100 text-yellow-800",
      },
      3: {
        text: t("submission.status.approved"),
        color: "bg-green-100 text-green-800",
      },
      4: {
        text: t("submission.status.rejected"),
        color: "bg-red-100 text-red-800",
      },
    };
    const statusInfo = statusMap[status] || {
      text: t("submission.status.unknown"),
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
      1: t("submission.filters.progress"),
      2: t("submission.filters.final"),
      3: t("submission.filters.other"),
    };
    return typeMap[type] || t("submission.status.unknown");
  };

  // (removed duplicate getTopicInfo defined later)

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
            <div className="flex-shrink-0"></div>
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
              {t("submission.filters.typeLabel")}
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
              placeholder={t("submission.filters.typePlaceholder")}
              isSearchable
              className="text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("submission.filters.searchLabel")}
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
                placeholder={t("submission.filters.searchPlaceholder")}
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              {t("submission.createNew")}
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
              {t("submission.loadingList")}
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            {t("submission.emptyList")}
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
                      {submission.reportTitle}
                    </h4>
                    <p
                      className="text-xs text-gray-600 mt-1 truncate"
                      title={`${t("submission.table.topicPrefix")} ${
                        getTopicInfo(submission.topicId).title
                      }`}
                    >
                      {t("submission.table.topicPrefix")} {""}
                      {truncateWords(getTopicInfo(submission.topicId).title, 4)}
                    </p>
                  </div>
                  <div>{getStatusBadge(submission.status)}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-500">
                      {t("submission.table.mobile.type")}
                    </span>
                    <span className="ml-1 font-medium">
                      {getSubmissionTypeText(submission.submissionType)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">
                      {t("submission.table.mobile.submittedAt")}
                    </span>
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
                          setShowFileModal(true) ||
                          (setFileUrl(null),
                          setFileName(getFileName(submission.filePath)),
                          setFileType(""),
                          setCurrentViewingSubmissionId(
                            submission.submissionId
                          ))
                        }
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 px-2 py-1 rounded"
                      >
                        <span>{getFileIcon(submission.filePath)}</span>
                        <span>{t("submission.table.view")}</span>
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
                        <span>{t("submission.table.download")}</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">
                      {t("submission.table.noFile")}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      navigate(
                        `/student/feedback?submission=${submission.submissionId}`
                      )
                    }
                    className="text-green-600 hover:text-green-900"
                  >
                    {t("submission.table.feedback")}
                  </button>
                  <button
                    onClick={() => openEditModal(submission)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {t("submission.table.edit")}
                  </button>
                  {submission.status !== 1 && (
                    <button
                      onClick={() =>
                        handleDeleteSubmission(submission.submissionId)
                      }
                      className="text-red-600 hover:text-red-900"
                    >
                      {t("submission.table.delete")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Table (Desktop) */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("submission.table.title")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("submission.table.topic")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  {t("submission.table.type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("submission.table.file")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  {t("submission.table.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  {t("submission.table.submittedAt")}
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("submission.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">
                      {t("submission.loadingList")}
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
                        <div
                          className="text-sm font-medium text-gray-900 truncate max-w-[240px]"
                          title={getTopicInfo(submission.topicId).title}
                        >
                          {truncateWords(
                            getTopicInfo(submission.topicId).title,
                            4
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTopicInfo(submission.topicId).code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
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
                              <span>{t("submission.table.view")}</span>
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
                                  className="bi bi-cloud-arrow-down-fill inline mr-1"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                                </svg>
                              )}
                              <span>{t("submission.table.download")}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Không có file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/student/feedback?submission=${submission.submissionId}`
                              )
                            }
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            {t("submission.table.feedback")}
                          </button>
                          <button
                            onClick={() => openEditModal(submission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {t("submission.table.edit")}
                          </button>
                          {submission.status !== 1 && (
                            <button
                              onClick={() =>
                                handleDeleteSubmission(submission.submissionId)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Xóa
                            </button>
                          )}
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
                  {t("submission.modal.create.title")}
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
                      {loadingTopics
                        ? t("submission.loadingList")
                        : t("submission.modal.create.topic")}
                    </option>
                    {confirmedTopics.map((topic) => {
                      const info = getTopicInfo(topic.topicId);
                      return (
                        <option key={topic.topicId} value={topic.topicId}>
                          {info.title} - {info.code}
                        </option>
                      );
                    })}
                  </select>
                  <label
                    htmlFor="create-topicId"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    {t("submission.modal.create.topic")}{" "}
                    <span className="text-red-500">*</span>
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
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    {t("submission.modal.create.titleLabel")}{" "}
                    <span className="text-red-500">*</span>
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
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    {t("submission.modal.create.description")}{" "}
                    <span className="text-red-500">*</span>
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
                    <option value={1}>
                      {t("submission.filters.progress")}
                    </option>
                    <option value={2}>{t("submission.filters.final")}</option>
                    <option value={3}>{t("submission.filters.other")}</option>
                  </select>
                  <label
                    htmlFor="create-type"
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    {t("submission.modal.create.type")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="mb-4 relative">
                  <input
                    id="create-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (50MB = 50 * 1024 * 1024 bytes)
                        const maxSize = 50 * 1024 * 1024;
                        if (file.size > maxSize) {
                          showToast(
                            "File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.",
                            "error"
                          );
                          e.target.value = ""; // Clear the input
                          return;
                        }
                      }
                      setFormData({ ...formData, file });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="create-file"
                    className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    {t("submission.modal.create.attachment")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("submission.modal.create.attachmentHelp")}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    {t("submission.modal.create.cancel")}
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
                    {loading
                      ? t("submission.modal.create.submitting")
                      : t("submission.modal.create.submit")}
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
                {t("submission.modal.edit.title")}
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
                      {loadingTopics
                        ? t("submission.loadingList")
                        : t("submission.modal.edit.topic")}
                    </option>
                    {confirmedTopics.map((topic) => {
                      const info = getTopicInfo(topic.topicId);
                      return (
                        <option key={topic.topicId} value={topic.topicId}>
                          {info.title} - {info.code}
                        </option>
                      );
                    })}
                  </select>
                  <label
                    htmlFor="edit-topicId"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    {t("submission.modal.edit.topic")}
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
                    {t("submission.modal.edit.titleLabel")}
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
                    {t("submission.modal.edit.description")}
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
                    <option value={1}>
                      {t("submission.filters.progress")}
                    </option>
                    <option value={2}>{t("submission.filters.final")}</option>
                    <option value={3}>{t("submission.filters.other")}</option>
                  </select>
                  <label
                    htmlFor="edit-type"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    {t("submission.modal.edit.type")}
                  </label>
                </div>
                <div className="mb-4 relative">
                  <input
                    id="edit-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (50MB = 50 * 1024 * 1024 bytes)
                        const maxSize = 50 * 1024 * 1024;
                        if (file.size > maxSize) {
                          showToast(
                            "File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.",
                            "error"
                          );
                          e.target.value = ""; // Clear the input
                          return;
                        }
                      }
                      setFormData({ ...formData, file });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="edit-file"
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                  >
                    {t("submission.modal.edit.attachmentOptional")}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("submission.modal.create.attachmentHelp")}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    {t("submission.modal.edit.cancel")}
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
                    {loading
                      ? t("submission.modal.edit.submitting")
                      : t("submission.modal.edit.submit")}
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
                {t("submission.modal.viewFile.title", { name: fileName })}
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
                    className="bi bi-cloud-arrow-down-fill inline mr-1"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                  </svg>
                  {t("submission.modal.viewFile.download")}
                </button>
                <button
                  onClick={closeFileModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t("submission.modal.viewFile.close")}
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
                          t("submission.modal.viewFile.cannotShowImage")
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
                        showToast(t("submission.modal.viewFile.cannotShowPdf"));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {t("submission.modal.viewFile.file", {
                            name: fileName,
                          })}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {t("submission.modal.viewFile.fileType", {
                            type: fileType,
                          })}
                        </p>
                        <p className="text-gray-600 mb-6">
                          {t("submission.modal.viewFile.notEmbeddable")}
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
                            className="bi bi-cloud-arrow-down-fill inline mr-1"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708" />
                          </svg>
                          {t("submission.modal.viewFile.downloadToView")}
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
        title={t("submission.modal.deleteConfirm.title")}
        message={t("submission.modal.deleteConfirm.message")}
        confirmText={t("submission.modal.deleteConfirm.confirm")}
        cancelText={t("submission.modal.deleteConfirm.cancel")}
        confirmVariant="danger"
        onConfirm={confirmDeleteSubmission}
        onCancel={cancelDeleteSubmission}
        loading={loading}
      />
    </div>
  );
};

export default SubmissionManagement;
