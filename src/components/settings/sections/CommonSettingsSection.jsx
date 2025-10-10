import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

/**
 * Component chung cho phần Notifications
 */
export const NotificationsSection = ({ settings, updateSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("settingsPage.notifications.title")}
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("settingsPage.notifications.email")}
            </label>
            <p className="text-xs text-gray-500">
              {t("settingsPage.notifications.emailDesc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications?.email || false}
              onChange={(e) =>
                updateSettings("notifications.email", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("settingsPage.notifications.push")}
            </label>
            <p className="text-xs text-gray-500">
              {t("settingsPage.notifications.pushDesc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications?.push || false}
              onChange={(e) =>
                updateSettings("notifications.push", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("settingsPage.notifications.sms")}
            </label>
            <p className="text-xs text-gray-500">
              {t("settingsPage.notifications.smsDesc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications?.sms || false}
              onChange={(e) =>
                updateSettings("notifications.sms", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

NotificationsSection.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
};

/**
 * Component chung cho phần Appearance
 */
export const AppearanceSection = ({ settings, updateSettings }) => {
  const { t } = useTranslation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for theme changes to force re-render
  useEffect(() => {
    const handleThemeChange = () => {
      setForceUpdate((prev) => prev + 1);
    };

    window.addEventListener("themeChanged", handleThemeChange);
    return () => window.removeEventListener("themeChanged", handleThemeChange);
  }, []);

  const handleLanguageChange = (value) => {
    updateSettings("appearance.language", value);
    // Language sẽ được apply khi save settings
  };

  const handleThemeChange = (value) => {
    updateSettings("appearance.theme", value);
    // Theme sẽ được apply ngay lập tức
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("settingsPage.appearance.title")}
      </h3>
      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("settingsPage.appearance.language")}
          </label>
          <select
            value={settings.appearance?.language || "vi"}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            key={`language-${settings.appearance?.language || "vi"}-${
              i18n.language
            }`}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("settingsPage.appearance.theme")}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.appearance?.theme === "light"}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                {t("settingsPage.appearance.light")}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.appearance?.theme === "dark"}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                {t("settingsPage.appearance.dark")}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

AppearanceSection.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
};
