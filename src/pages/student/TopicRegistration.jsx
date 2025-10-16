import React, { useState, useEffect } from "react";
import Select from "react-select";
import registrationService from "../../services/registration.service";
import { userService } from "../../services";
import registrationPeriodService from "../../services/registrationPeriod.service";
import ThesisRegisterModal from "./ThesisRegister.jsx";
import { showToast } from "../../utils/toastHelper";
import { useTranslation } from "react-i18next";

const difficultyMap = {
  ADVANCED: {
    label: "Khó",
    class: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  HARD: {
    label: "Khó",
    class: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  INTERMEDIATE: {
    label: "Trung bình",
    class: "bg-blue-100 text-blue-800 border-blue-200",
  },
  MEDIUM: {
    label: "Trung bình",
    class: "bg-blue-100 text-blue-800 border-blue-200",
  },
  BEGINNER: {
    label: "Dễ",
    class: "bg-green-100 text-green-800 border-green-200",
  },
  EASY: {
    label: "Dễ",
    class: "bg-green-100 text-green-800 border-green-200",
  },
};

const translateDifficulty = (level) => {
  if (!level) return "";
  const key = String(level).toUpperCase();
  return difficultyMap[key]?.label || level;
};

const TopicRegistration = () => {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [serverPage, setServerPage] = useState(0);
  const [serverSize] = useState(12);
  const [serverTotalPages, setServerTotalPages] = useState(0);
  // Bỏ lọc theo Khoa và Năm học
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(10);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [activePeriods, setActivePeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [lecturerNameMap, setLecturerNameMap] = useState({});

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await registrationService.getAvailableTopicList();
        const periodsRes = await registrationPeriodService.getActivePeriods();

        // Không vội hiển thị lỗi nếu API currentPeriod không có; đợi kiểm tra activePeriods

        if (Array.isArray(res.data)) {
          setTopics(res.data);
        } else if (res.success) {
          setTopics(res.data || []);
        } else {
          setError(res.message || "Không thể tải danh sách đề tài");
        }

        // Lưu thông tin đợt đăng ký hiện tại
        if (periodsRes.success && Array.isArray(periodsRes.data)) {
          setActivePeriods(periodsRes.data);
          if (!selectedPeriodId && periodsRes.data.length > 0) {
            setSelectedPeriodId(periodsRes.data[0].periodId);
            setCurrentPeriod(periodsRes.data[0]);
          }
          // Nếu có ít nhất 1 đợt ACTIVE, clear lỗi
          if (periodsRes.data.length > 0) {
            setError("");
          } else {
            // Nếu không có đợt nào ACTIVE
            setError("Hiện tại không có đợt đăng ký nào đang diễn ra!");
          }
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách đề tài");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  // Cập nhật currentPeriod khi selectedPeriodId thay đổi
  useEffect(() => {
    if (selectedPeriodId && activePeriods.length > 0) {
      const selectedPeriod = activePeriods.find(
        (p) => p.periodId === selectedPeriodId
      );
      if (selectedPeriod) {
        setCurrentPeriod(selectedPeriod);
      }
    }
  }, [selectedPeriodId, activePeriods]);

  // Tải danh sách giảng viên để ánh xạ supervisorId -> fullName
  useEffect(() => {
    const loadLecturers = async () => {
      try {
        const teachers = await userService.getAllTeachers();
        const map = {};
        (teachers || []).forEach((t) => {
          if (t?.userId)
            map[t.userId] = t.fullName || t.name || `GV ${t.userId}`;
        });
        setLecturerNameMap(map);
      } catch (e) {
        // ignore
      }
    };
    loadLecturers();
  }, []);

  // Gọi API filter khi search thay đổi hoặc serverPage thay đổi
  useEffect(() => {
    // Chỉ gọi filterTopics khi search có giá trị thực sự
    if (!search.trim()) return;

    const doFilter = async () => {
      try {
        const payload = {
          searchPattern: search || undefined,
          page: serverPage,
          size: serverSize,
          sortBy: "topicId",
          sortDirection: "DESC",
          userRole: "STUDENT",
        };
        const res = await registrationService.filterTopics(payload);
        if (res.success && res.data) {
          setTopics(res.data.content || []);
          setServerTotalPages(res.data.totalPages || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    doFilter();
  }, [search, serverPage]);

  // Đồng bộ panel "đợt hiện tại" theo lựa chọn dropdown
  useEffect(() => {
    if (!selectedPeriodId) return;
    const found = activePeriods.find((p) => p.periodId === selectedPeriodId);
    if (found) setCurrentPeriod(found);
  }, [selectedPeriodId, activePeriods]);

  const filterTopics = () => {
    return topics.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.topicCode.toLowerCase().includes(search.toLowerCase()) ||
        (t.supervisorName || "").toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "bg-green-600 hover:bg-green-700";
    if (status === "Pending") return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-orange-500 hover:bg-orange-600";
  };

  const handleRegister = async (topicId) => {
    setRegisteringId(topicId);
    try {
      if (!selectedPeriodId) {
        showToast("Vui lòng chọn đợt đăng ký", "error");
        return;
      }
      const res = await registrationService.registerTopic(
        topicId,
        selectedPeriodId
      );

      if (res.success) {
        // Cập nhật trạng thái đề tài thành "Pending" khi đăng ký thành công
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic.topicId === topicId ? { ...topic, status: "Pending" } : topic
          )
        );
        showToast(
          res.message ||
            "Đăng ký đề tài thành công! Vui lòng chờ giảng viên duyệt."
        );
      } else {
        showToast(res.message || "Đăng ký đề tài thất bại", "error");
      }
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err);
      showToast("Đã xảy ra lỗi khi đăng ký đề tài", "error");
    } finally {
      setRegisteringId(null);
    }
  };

  const clearFilters = async () => {
    setSearch("");
    setCurrentPage(1);
    // Reload lại dữ liệu gốc từ getAvailableTopicList
    try {
      const res = await registrationService.getAvailableTopicList();
      if (Array.isArray(res.data)) {
        setTopics(res.data);
      } else if (res.success) {
        setTopics(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi reload danh sách đề tài:", err);
    }
  };

  const filteredTopics = topics; // đã lọc từ server
  const currentTopics = filteredTopics;
  const totalPages = serverTotalPages || 1;

  // Options cho react-select của danh sách đợt đăng ký
  const periodOptions = activePeriods.map((p) => ({
    value: p.periodId,
    label: `${p.periodName} (${new Date(p.startDate).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US"
    )} - ${new Date(p.endDate).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US"
    )})`,
  }));

  // Đã bỏ data filter theo Khoa và Năm học

  // Custom styles cho react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "38px",
      backgroundColor: "white",
      borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(255, 102, 0, 0.1)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#ff6600" : "#9ca3af",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#ff6600"
        : state.isFocused
        ? "#fff7ed"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#ff6600" : "#fff7ed",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
    }),
  };

  // Styles cho Select trong banner, đảm bảo menu không bị che khuất
  const periodSelectStyles = {
    ...customSelectStyles,
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600 text-lg">{t("topics.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-3">
      {/* Chọn đợt đăng ký (nhiều đợt song song) */}
      {activePeriods.length > 0 && (
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #223A5B 0%, #2D4B78 100%)",
            }}
          />
          <div className="relative rounded-2xl p-4 sm:p-6 text-white ring-1 ring-white/10 shadow-lg">
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center shadow ring-1 ring-white/30">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="m-0 text-base sm:text-lg font-semibold text-white">
                    {t("topics.selectPeriod")}
                  </h3>
                  {currentPeriod && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="text-white/90">
                        {currentPeriod.periodName} •{" "}
                        {new Date(currentPeriod.startDate).toLocaleDateString()}{" "}
                        - {new Date(currentPeriod.endDate).toLocaleDateString()}
                      </span>
                      {(() => {
                        try {
                          const end = new Date(currentPeriod.endDate);
                          const now = new Date();
                          const days = Math.ceil(
                            (end - now) / (1000 * 60 * 60 * 24)
                          );
                          const label =
                            days > 0 ? `${days} ngày còn lại` : `Đã kết thúc`;
                          const cls =
                            days > 7
                              ? "bg-white/15 text-white"
                              : days > 0
                              ? "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/40"
                              : "bg-white/10 text-white/80 ring-1 ring-white/20";
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs ${cls}`}
                            >
                              {label}
                            </span>
                          );
                        } catch (_) {
                          return null;
                        }
                      })()}
                      <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs bg-white/10 text-white/90 ring-1 ring-white/20">
                        {activePeriods.length} đợt đang mở
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-[240px] lg:min-w-[340px] bg-white/95 rounded-xl p-1 shadow ring-1 ring-white/10">
                <Select
                  value={
                    periodOptions.find((o) => o.value === selectedPeriodId) ||
                    null
                  }
                  onChange={(opt) => setSelectedPeriodId(opt?.value || null)}
                  options={periodOptions}
                  styles={periodSelectStyles}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  menuPlacement="auto"
                  placeholder={t("topics.selectPeriodPlaceholder")}
                  isClearable={false}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="mt-3 text-[11px] sm:text-xs text-white/80">
              {t("topics.tipSelectPeriod", {
                defaultValue:
                  "Chọn đợt để lọc danh sách đề tài đang nhận đăng ký",
              })}
            </div>
          </div>
        </div>
      )}

      {/* Current period banner removed as requested */}

      {/* Hiển thị thông báo khi không có đợt đăng ký */}
      {error && error.includes("không có đợt đăng ký") && (
        <div className="no-period-warning bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
          <div className="text-yellow-800">
            <h3 className="text-lg font-semibold mb-2">
              {t("topics.noActivePeriodTitle")}
            </h3>
            <p>{t("topics.noActivePeriodMessage")}</p>
          </div>
        </div>
      )}

      {/* Nút mở modal đề xuất đề tài */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #ea580c 100%, #fb923c 0%)",
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {t("topics.createProposal")}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 mb-6 shadow-sm flex gap-4 items-end flex-wrap">
        {/* Search Filter */}
        <div className="flex flex-col gap-2 flex-1 min-w-[300px]">
          <label className="font-semibold text-gray-800 text-sm">
            {t("topics.searchLabel")}
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder={t("topics.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex flex-col gap-2">
          <div className="h-5"></div> {/* Spacer để align với label */}
          <button
            className="px-4 py-2 bg-gray-500 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-600 whitespace-nowrap h-[36px]"
            onClick={clearFilters}
          >
            {t("topics.clearFilters")}
          </button>
        </div>
      </div>

      {!error && (
        <>
          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {currentTopics.map((topic) => (
              <div
                key={topic.topicId}
                className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary-500 transition-all duration-200 flex flex-col gap-3 min-h-[200px]"
              >
                {/* Topic Title */}
                <div className="text-base font-semibold text-gray-900 leading-tight">
                  {topic.title}
                </div>

                {/* Topic Description */}
                <div className="text-sm text-gray-600 leading-relaxed flex-grow">
                  {topic.description}
                </div>

                {/* Topic Meta */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                  {/* Supervisor */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      {t("topics.supervisor")}
                    </span>
                    <span className="text-sm font-semibold text-primary-600">
                      {lecturerNameMap[topic.supervisorId] ||
                        topic.supervisorName ||
                        t("topics.updating")}
                    </span>
                  </div>
                </div>

                {/* Register Button */}
                <button
                  className={`mt-auto py-2 px-0 rounded-md font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-sm ${
                    topic.status === "Approved" ||
                    topic.status === "Pending" ||
                    registeringId === topic.topicId ||
                    topic.currentStudents >= topic.maxStudents
                      ? "opacity-60 cursor-not-allowed"
                      : getStatusColor(topic.status)
                  } ${
                    topic.status === "Approved"
                      ? "bg-green-600 text-white"
                      : topic.status === "Pending"
                      ? "bg-yellow-500 text-gray-900"
                      : "text-white"
                  }`}
                  disabled={
                    topic.status === "Approved" ||
                    topic.status === "Pending" ||
                    registeringId === topic.topicId ||
                    topic.currentStudents >= topic.maxStudents
                  }
                  onClick={() => handleRegister(topic.topicId)}
                >
                  {registeringId === topic.topicId
                    ? t("topics.registering")
                    : topic.status === "Approved"
                    ? t("topics.approved")
                    : topic.status === "Pending"
                    ? t("topics.pending")
                    : topic.currentStudents >= topic.maxStudents
                    ? t("topics.full")
                    : t("topics.register")}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 my-4 items-center">
              <button
                className="bg-white border border-gray-300 text-gray-600 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`border rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 min-w-[36px] ${
                      serverPage + 1 === page
                        ? "bg-blue-900 text-white border-blue-900"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-blue-900 hover:text-white hover:border-blue-900"
                    }`}
                    onClick={() => setServerPage(page - 1)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="bg-white border border-gray-300 text-gray-600 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-blue-900 hover:text-white hover:border-blue-900 min-w-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  setServerPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={serverPage + 1 === totalPages}
              >
                Tiếp
              </button>
            </div>
          )}

          {/* Pagination Info */}
          {filteredTopics.length > 0 && (
            <div className="text-center mb-4 text-gray-500 text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-md">
              <p className="m-0 p-3 bg-gray-50 rounded-md border border-gray-200">
                Trang {serverPage + 1}/{totalPages} — {filteredTopics.length} đề
                tài hiển thị
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal Đề xuất đề tài */}
      <ThesisRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        selectedPeriod={currentPeriod}
      />
    </div>
  );
};

export default TopicRegistration;
