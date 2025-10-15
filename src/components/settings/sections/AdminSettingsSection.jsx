import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * Component cho phần settings của Admin
 */
export const AdminSettingsSection = ({ settings, updateSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Admin Badge */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold">
              {t("settingsPage.admin.title")}
            </h3>
            <p className="text-sm opacity-90">
              {t("settingsPage.admin.subtitle")}
            </p>
          </div>
        </div>
      </div>
      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("settingsPage.system.title")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("settingsPage.system.showAnalytics")}
              </label>
              <p className="text-xs text-gray-500">
                {t("settingsPage.system.showAnalyticsDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system?.showAnalytics || false}
                onChange={(e) =>
                  updateSettings("system.showAnalytics", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("settingsPage.system.autoBackup")}
              </label>
              <p className="text-xs text-gray-500">
                {t("settingsPage.system.autoBackupDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system?.autoBackup || false}
                onChange={(e) =>
                  updateSettings("system.autoBackup", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("settingsPage.security.title")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("settingsPage.security.twoFactorAuth")}
              </label>
              <p className="text-xs text-gray-500">
                {t("settingsPage.security.twoFactorAuthDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security?.twoFactorAuth || false}
                onChange={(e) =>
                  updateSettings("security.twoFactorAuth", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("settingsPage.security.sessionTimeout")}
            </label>
            <p className="text-xs text-gray-500">
              {t("settingsPage.security.sessionTimeoutDesc")}
            </p>
            <select
              value={settings.security?.sessionTimeout || 30}
              onChange={(e) =>
                updateSettings(
                  "security.sessionTimeout",
                  parseInt(e.target.value)
                )
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={15}>
                15 {t("settingsPage.security.minutes")}
              </option>
              <option value={30}>
                30 {t("settingsPage.security.minutes")}
              </option>
              <option value={60}>
                60 {t("settingsPage.security.minutes")}
              </option>
              <option value={120}>
                120 {t("settingsPage.security.minutes")}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Admin Features */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          {t("settingsPage.admin.advancedFeatures")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-red-700">
                {t("settingsPage.admin.maintenanceMode")}
              </label>
              <p className="text-xs text-red-600">
                {t("settingsPage.admin.maintenanceModeDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system?.maintenanceMode || false}
                onChange={(e) =>
                  updateSettings("system.maintenanceMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-red-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-red-700">
                {t("settingsPage.admin.debugMode")}
              </label>
              <p className="text-xs text-red-600">
                {t("settingsPage.admin.debugModeDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system?.debugMode || false}
                onChange={(e) =>
                  updateSettings("system.debugMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-red-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminSettingsSection.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
};
