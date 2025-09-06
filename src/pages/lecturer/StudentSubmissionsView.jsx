import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as submissionService from "../../services/submission.service";
import { getUserIdFromToken } from "../../auth/authUtils";

const StudentSubmissionsView = () => {
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
  const [filters, setFilters] = useState({
    status: "",
    submissionType: "",
    search: "",
  });

  useEffect(() => {
    loadSubmissions();
  }, [currentPage, filters]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await submissionService.getSubmissionsWithPagination(
        currentPage,
        10
      );
      setSubmissions(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Lỗi khi tải danh sách báo cáo");
    } finally {
      setLoading(false);
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
    if (!filePath) return "📄";

    const extension = filePath.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📽️";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📄";
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
        return "Báo cáo cuối kỳ";
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
      toast.error("Lỗi khi tải file");
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

      toast.success("File đã được tải về");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Lỗi khi tải file");
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Báo cáo của sinh viên
          </h1>
          <p className="mt-2 text-gray-600">
            Xem và quản lý các báo cáo mà sinh viên đã nộp
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="1">Đã nộp</option>
                <option value="2">Đang xem xét</option>
                <option value="3">Đã duyệt</option>
                <option value="4">Từ chối</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại báo cáo
              </label>
              <select
                value={filters.submissionType}
                onChange={(e) =>
                  setFilters({ ...filters, submissionType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả loại</option>
                <option value="1">Báo cáo tiến độ</option>
                <option value="2">Báo cáo cuối kỳ</option>
                <option value="3">Báo cáo khác</option>
              </select>
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

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
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
                          {submission.studentName || "Sinh viên"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.studentId || "N/A"}
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
                                <span>📥</span>
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
                        toast.error("Lỗi khi tải file");
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    📥 Tải về
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
                          toast.error(
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
                                  toast.error("Lỗi khi tải file");
                                }
                              }}
                              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              📥 Tải về để xem
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
                                toast.error("Lỗi khi tải file");
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
      </div>
    </div>
  );
};

export default StudentSubmissionsView;
