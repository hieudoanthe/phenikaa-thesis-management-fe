import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useTranslation } from "react-i18next";

const LOCAL_KEY = "student_settings_v1";

const defaultSettings = {
  notifications: {
    enableToasts: true,
    importantAlwaysOn: true,
    sound: false,
  },
  appearance: {
    theme: "system", // light | dark | system
    fontSize: "normal", // small | normal | large
    density: "comfortable", // comfortable | standard | compact
    language: "vi", // vi | en
  },
};

// react-select custom styles: primary-500 background for selected option
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 38,
    borderColor: state.isFocused ? "#ea580c" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 2px rgba(234, 88, 12, 0.15)" : "none",
    "&:hover": { borderColor: "#ea580c" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#ea580c" // primary-500
      : state.isFocused
      ? "#fff7ed" // primary-50-ish
      : undefined,
    color: state.isSelected ? "#ffffff" : provided.color,
    "&:active": { backgroundColor: "#ea580c", color: "#ffffff" },
  }),
  singleValue: (provided) => ({ ...provided }),
  placeholder: (provided) => ({ ...provided }),
  menu: (provided) => ({ ...provided, zIndex: 40 }),
};

const Settings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (_) {}
  }, []);

  const save = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    // Phát sự kiện cho Layout/Toast/Theme đọc và áp dụng nếu cần
    try {
      window.dispatchEvent(
        new CustomEvent("app:student-settings", { detail: settings })
      );
    } catch (_) {}
  };

  const onChange = (path, value) => {
    setSettings((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = cloned;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return cloned;
    });
  };

  return (
    <div className="p-6 w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("settingsPage.title")}
        </h2>

        {/* Notifications */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t("settingsPage.notifications.title")}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.enableToasts}
                onChange={(e) =>
                  onChange("notifications.enableToasts", e.target.checked)
                }
              />
              <span>{t("settingsPage.notifications.enableToasts")}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.importantAlwaysOn}
                onChange={(e) =>
                  onChange("notifications.importantAlwaysOn", e.target.checked)
                }
              />
              <span>{t("settingsPage.notifications.importantAlwaysOn")}</span>
            </label>

            {/* DND removed as requested */}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.sound}
                onChange={(e) =>
                  onChange("notifications.sound", e.target.checked)
                }
              />
              <span>{t("settingsPage.notifications.sound")}</span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t("settingsPage.appearance.title")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settingsPage.appearance.theme")}
              </label>
              <Select
                value={{
                  value: settings.appearance.theme,
                  label:
                    settings.appearance.theme === "light"
                      ? t("settingsPage.appearance.options.theme.light")
                      : settings.appearance.theme === "dark"
                      ? t("settingsPage.appearance.options.theme.dark")
                      : t("settingsPage.appearance.options.theme.system"),
                }}
                onChange={(opt) => onChange("appearance.theme", opt?.value)}
                options={[
                  {
                    value: "light",
                    label: t("settingsPage.appearance.options.theme.light"),
                  },
                  {
                    value: "dark",
                    label: t("settingsPage.appearance.options.theme.dark"),
                  },
                  {
                    value: "system",
                    label: t("settingsPage.appearance.options.theme.system"),
                  },
                ]}
                classNamePrefix="settings-select"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settingsPage.appearance.fontSize")}
              </label>
              <Select
                value={{
                  value: settings.appearance.fontSize,
                  label:
                    settings.appearance.fontSize === "small"
                      ? t("settingsPage.appearance.options.fontSize.small")
                      : settings.appearance.fontSize === "normal"
                      ? t("settingsPage.appearance.options.fontSize.normal")
                      : t("settingsPage.appearance.options.fontSize.large"),
                }}
                onChange={(opt) => onChange("appearance.fontSize", opt?.value)}
                options={[
                  {
                    value: "small",
                    label: t("settingsPage.appearance.options.fontSize.small"),
                  },
                  {
                    value: "normal",
                    label: t("settingsPage.appearance.options.fontSize.normal"),
                  },
                  {
                    value: "large",
                    label: t("settingsPage.appearance.options.fontSize.large"),
                  },
                ]}
                classNamePrefix="settings-select"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settingsPage.appearance.density")}
              </label>
              <Select
                value={{
                  value: settings.appearance.density,
                  label:
                    settings.appearance.density === "comfortable"
                      ? t("settingsPage.appearance.options.density.comfortable")
                      : settings.appearance.density === "standard"
                      ? t("settingsPage.appearance.options.density.standard")
                      : t("settingsPage.appearance.options.density.compact"),
                }}
                onChange={(opt) => onChange("appearance.density", opt?.value)}
                options={[
                  {
                    value: "comfortable",
                    label: t(
                      "settingsPage.appearance.options.density.comfortable"
                    ),
                  },
                  {
                    value: "standard",
                    label: t(
                      "settingsPage.appearance.options.density.standard"
                    ),
                  },
                  {
                    value: "compact",
                    label: t("settingsPage.appearance.options.density.compact"),
                  },
                ]}
                classNamePrefix="settings-select"
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settingsPage.appearance.language")}
              </label>
              <Select
                value={{
                  value: settings.appearance.language,
                  label:
                    settings.appearance.language === "vi"
                      ? t("settingsPage.appearance.options.language.vi")
                      : t("settingsPage.appearance.options.language.en"),
                }}
                onChange={(opt) => onChange("appearance.language", opt?.value)}
                options={[
                  {
                    value: "vi",
                    label: t("settingsPage.appearance.options.language.vi"),
                  },
                  {
                    value: "en",
                    label: t("settingsPage.appearance.options.language.en"),
                  },
                ]}
                classNamePrefix="settings-select"
                styles={selectStyles}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            className="px-4 py-2 text-white rounded-lg"
            style={{ backgroundColor: "#ea580c" }}
          >
            {t("settingsPage.save")}
          </button>
          {saved && (
            <span className="text-green-600 text-sm">
              {t("settingsPage.saved")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
