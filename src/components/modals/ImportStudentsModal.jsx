import React, { useState, useRef } from "react";
import { showToast } from "../../utils/toastHelper";
import importService from "../../services/import.service";

const ImportStudentsModal = ({
  isOpen,
  onClose,
  periodId,
  academicYearId,
  onImportSuccess,
}) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        showToast("Vui lòng chọn file CSV", "error");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast("Vui lòng chọn file CSV", "error");
      return;
    }

    if (!periodId || !academicYearId) {
      showToast("Thiếu thông tin đợt đăng ký hoặc năm học", "error");
      return;
    }

    setImporting(true);
    try {
      const result = await importService.importStudentsFromCSV(
        file,
        periodId,
        academicYearId
      );

      if (result.success) {
        setImportResult(result.data);
        showToast(
          `Import thành công: ${result.data.successCount} sinh viên, ${result.data.errorCount} lỗi`,
          "success"
        );

        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        showToast(result.message || "Import thất bại", "error");
      }
    } catch (error) {
      console.error("Lỗi khi import:", error);
      showToast("Có lỗi xảy ra khi import", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    importService.downloadCSVTemplate();
    showToast("Đã tải template CSV", "info");
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Import sinh viên từ CSV
            </h2>
            <button
              onClick={handleClose}
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

          <div className="space-y-6">
            {/* Hướng dẫn */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Hướng dẫn import:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • File CSV phải có đúng 3 cột: Họ và tên, Username, Mật khẩu
                </li>
                <li>• Dòng đầu tiên là header, sẽ được bỏ qua</li>
                <li>• Username chính là email (dùng để đăng nhập)</li>
                <li>• Username phải duy nhất</li>
                <li>• Vai trò mặc định: Sinh viên</li>
              </ul>
            </div>

            {/* Download template */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-gray-900">Template CSV</h3>
                <p className="text-sm text-gray-600">
                  Tải file mẫu để tham khảo định dạng
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tải template
              </button>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn file CSV
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Import result */}
            {importResult && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Kết quả import:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng dòng:</span>
                    <span className="font-medium">
                      {importResult.totalRows}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thành công:</span>
                    <span className="font-medium text-green-600">
                      {importResult.successCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lỗi:</span>
                    <span className="font-medium text-red-600">
                      {importResult.errorCount}
                    </span>
                  </div>
                </div>

                {/* Chi tiết lỗi */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">
                      Chi tiết lỗi:
                    </h4>
                    <div className="max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 mb-1">
                          Dòng {error.rowNumber}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={importing}
              >
                Đóng
              </button>
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? "Đang import..." : "Import sinh viên"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;
