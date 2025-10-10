import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsProvider,
  useSettings,
} from "../../components/settings/SettingsProvider";
import {
  NotificationsSection,
  AppearanceSection,
} from "../../components/settings/sections/CommonSettingsSection";
import { StudentSettingsSection } from "../../components/settings/sections/StudentSettingsSection";

const StudentSettingsContent = () => {
  const { t } = useTranslation();
  const { settings, saveSettings, updateSettings, resetSettings, isLoading } =
    useSettings();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle save settings
  const handleSave = () => {
    const success = saveSettings(settings);
    if (success) {
      setHasUnsavedChanges(false);
      // Show success message
    }
  };

  // Handle reset settings
  const handleReset = () => {
    if (window.confirm(t("settingsPage.reset.confirm"))) {
      resetSettings();
      setHasUnsavedChanges(false);
    }
  };

  // Handle settings change
  const handleSettingsChange = (path, value) => {
    updateSettings(path, value);
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("settingsPage.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("settingsPage.title")}
          </h1>
          <p className="mt-2 text-gray-600">{t("settingsPage.subtitle")}</p>

          {/* Student Badge */}
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-lg">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="font-semibold">Student Settings</span>
          </div>
        </div>

        <div className="space-y-6">
          <NotificationsSection
            settings={settings}
            updateSettings={handleSettingsChange}
          />

          <AppearanceSection
            settings={settings}
            updateSettings={handleSettingsChange}
          />

          <StudentSettingsSection
            settings={settings}
            updateSettings={handleSettingsChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("settingsPage.reset.button")}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              hasUnsavedChanges
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t("settingsPage.save.button")}
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {t("settingsPage.unsavedChanges")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentSettings = () => {
  return (
    <SettingsProvider>
      <StudentSettingsContent />
    </SettingsProvider>
  );
};

export default StudentSettings;
