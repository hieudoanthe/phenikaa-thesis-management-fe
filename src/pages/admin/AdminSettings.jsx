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
import { AdminSettingsSection } from "../../components/settings/sections/AdminSettingsSection";

const AdminSettingsContent = () => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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

          {/* Admin Badge */}
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Admin Settings</span>
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

          <AdminSettingsSection
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
                ? "bg-purple-600 text-white hover:bg-purple-700"
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

const AdminSettings = () => {
  return (
    <SettingsProvider>
      <AdminSettingsContent />
    </SettingsProvider>
  );
};

export default AdminSettings;
