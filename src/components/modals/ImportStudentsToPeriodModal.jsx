import React, { useState } from "react";
import { toast } from "react-toastify";
import { importService } from "../../services";

const ImportStudentsToPeriodModal = ({
  isOpen,
  onClose,
  onImportSuccess,
  periodId,
  periodName,
  academicYearId,
}) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        toast.error("Vui lòng chọn file CSV");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (
        droppedFile.type !== "text/csv" &&
        !droppedFile.name.endsWith(".csv")
      ) {
        toast.error("Vui lòng chọn file CSV");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Vui lòng chọn file CSV");
      return;
    }

    if (!periodId) {
      toast.error("Không tìm thấy thông tin đợt đăng ký");
      return;
    }

    setIsLoading(true);
    try {
      const result = await importService.importStudentsFromCSV(
        file,
        periodId,
        academicYearId
      );

      if (result.success) {
        const successCount = result?.data?.successCount ?? 0;
        const errorCount = result?.data?.errorCount ?? 0;
        toast.success(
          `Nhập danh sách sinh viên thành công: ${successCount} sinh viên được thêm vào đợt "${periodName}"${
            errorCount ? `, ${errorCount} lỗi` : ""
          }`
        );
        onImportSuccess?.();
        handleClose();
      } else {
        toast.error(result.message || "Nhập danh sách sinh viên thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi nhập danh sách sinh viên:", error);
      toast.error("Lỗi khi nhập danh sách sinh viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setIsLoading(false);
    onClose();
  };

  const downloadTemplate = () => {
    importService.downloadStudentCSVTemplate();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            Nhập danh sách Sinh viên
          </h2>
          {periodName && (
            <p className="text-sm text-gray-600 mt-1">
              Đợt đăng ký: <span className="font-medium">{periodName}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Download template */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Mẫu CSV</p>
                <p className="text-xs text-gray-500">
                  Tải file mẫu để tham khảo định dạng
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
              >
                Tải mẫu
              </button>
            </div>

            {/* File upload */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary-400 bg-primary-50"
                    : "border-gray-300 hover:border-primary-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-8 h-8 text-primary-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-primary-600">
                    {file
                      ? file.name
                      : "Kéo thả file CSV vào đây hoặc nhấp để chọn"}
                  </p>
                  <p className="text-xs text-primary-500 mt-1">
                    Chỉ chấp nhận file .csv
                  </p>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-green-700">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <svg
                      className="w-4 h-4"
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
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!file || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Đang nhập... " : "Nhập danh sách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsToPeriodModal;
