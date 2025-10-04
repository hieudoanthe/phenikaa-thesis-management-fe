import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserIdFromToken } from "../../auth/authUtils";
import scheduleService from "../../services/schedule.service";

const StudentSchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week, month

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const userId = getUserIdFromToken();

        if (!userId) {
          console.error("Không tìm thấy user ID");
          return;
        }

        try {
          // Load real schedule data from API
          const response = await scheduleService.getCompleteSchedule(
            parseInt(userId)
          );

          if (response.success && response.data) {
            // Transform API data to match UI format
            const transformedSchedule = response.data.map((item, index) => ({
              id: item.scheduleId || item.assignmentId || index + 1,
              title: item.title || "Sự kiện",
              date:
                item.date ||
                item.dueDate ||
                new Date().toISOString().split("T")[0],
              time: item.time || item.dueTime || "09:00",
              location: item.location || "Online",
              type: item.eventType || "general",
              status: item.status || "upcoming",
              supervisor: item.supervisor || "Hệ thống",
              description: item.description || "",
            }));

            setSchedule(transformedSchedule);
            return;
          }
        } catch (apiError) {
          console.error("API call failed:", apiError);
          // Set empty schedule if API fails
          setSchedule([]);
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "defense":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-calendar-event-fill"
            viewBox="0 0 16 16"
          >
            <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2m-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5" />
          </svg>
        );
      case "meeting":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
      case "deadline":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-clock-fill"
            viewBox="0 0 16 16"
          >
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getDaysUntilEvent = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 pt-0 w-full">
      {/* Header with Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/student/home")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Trang chủ</span>
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900">Lịch</span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "week"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "month"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {schedule.length > 0 ? (
          schedule.map((event) => {
            const daysLeft = getDaysUntilEvent(event.date);
            return (
              <div
                key={event.id}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          event.type === "defense"
                            ? "bg-blue-100 text-blue-600"
                            : event.type === "deadline"
                            ? "bg-red-100 text-red-600"
                            : event.type === "meeting"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getTypeIcon(event.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formatDate(event.date)} lúc {event.time}
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status === "upcoming"
                        ? "Sắp tới"
                        : event.status === "urgent"
                        ? "Khẩn cấp"
                        : "Hoàn thành"}
                    </span>
                    {daysLeft >= 0 && (
                      <span
                        className={`text-sm font-bold ${
                          daysLeft <= 3
                            ? "text-red-600"
                            : daysLeft <= 7
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {daysLeft === 0
                          ? "Hôm nay"
                          : daysLeft === 1
                          ? "Ngày mai"
                          : `${daysLeft} ngày`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có lịch trình
            </h3>
            <p className="text-gray-500">
              Bạn chưa có lịch trình nào được lên kế hoạch
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;
