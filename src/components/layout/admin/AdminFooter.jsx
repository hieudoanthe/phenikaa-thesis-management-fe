import React from "react";
import { useTranslation } from "react-i18next";

const AdminFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-2 w-full">
      <div className="px-6">
        <div className="flex items-center justify-between text-xs text-primary-500">
          <span>© {currentYear} By Hieu Doan The</span>
          <span>Hệ thống quản lý đồ án tốt nghiệp v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
