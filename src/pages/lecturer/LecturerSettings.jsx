import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SettingsProvider,
  useSettings,
} from "../../components/settings/SettingsProvider";
import { AppearanceSection } from "../../components/settings/sections/CommonSettingsSection";
import { TeacherSettingsSection } from "../../components/settings/sections/TeacherSettingsSection";

const LecturerSettingsContent = () => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("settingsPage.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Teacher Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              {t("settingsPage.teacher.title")}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <AppearanceSection
            settings={settings}
            updateSettings={handleSettingsChange}
          />

          <TeacherSettingsSection
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
                ? "bg-green-600 text-white hover:bg-green-700"
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

const LecturerSettings = () => {
  return (
    <SettingsProvider>
      <LecturerSettingsContent />
    </SettingsProvider>
  );
};

export default LecturerSettings;
