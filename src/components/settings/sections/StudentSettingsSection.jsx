import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * Component cho phần settings của Student
 */
export const StudentSettingsSection = ({ settings, updateSettings }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Student Badge */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
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
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold">Student Settings</h3>
            <p className="text-sm opacity-90">
              Academic and learning preferences
            </p>
          </div>
        </div>
      </div>
      {/* Academic Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("settingsPage.academic.title")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("settingsPage.academic.showGrades")}
              </label>
              <p className="text-xs text-gray-500">
                {t("settingsPage.academic.showGradesDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.academic?.showGrades || false}
                onChange={(e) =>
                  updateSettings("academic.showGrades", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("settingsPage.academic.showSchedule")}
              </label>
              <p className="text-xs text-gray-500">
                {t("settingsPage.academic.showScheduleDesc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.academic?.showSchedule || false}
                onChange={(e) =>
                  updateSettings("academic.showSchedule", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

StudentSettingsSection.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired,
};
