import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import userService from "../services/user.service";
import { getToken } from "../auth/authUtils";

// Tạo context cho Teacher Profile
const ProfileTeacherContext = createContext();

// Hook để sử dụng context
export const useProfileTeacher = () => {
  const context = useContext(ProfileTeacherContext);
  if (!context) {
    console.error("useProfileTeacher context không tồn tại!");
    throw new Error(
      "useProfileTeacher phải được sử dụng trong ProfileTeacherProvider"
    );
  }
  return context;
};

// Provider component
export const ProfileTeacherProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    department: "",
    specialization: "",
    maxStudents: 5,
    currentStudents: 0,
    currentTopics: 0,
    avt: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Lấy userId từ access token
  const getUserIdFromToken = () => {
    try {
      const token = getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || null;
    } catch (error) {
      console.error("Lỗi khi decode token:", error);
      return null;
    }
  };

  // Fetch profile data từ API - sử dụng useCallback để tránh re-create function
  const fetchProfileData = useCallback(
    async (forceRefresh = false) => {
      try {
        // Kiểm tra nếu đã có dữ liệu và không yêu cầu refresh
        if (hasInitialData && !forceRefresh) {
          return;
        }

        setIsLoading(true);
        setError(null);

        const userId = getUserIdFromToken();
        if (!userId) {
          throw new Error("Không thể lấy userId từ token");
        }

        const response = await userService.getTeacherProfile(userId);
        const responseData = response?.data || response;

        if (responseData) {
          const newProfileData = {
            fullName: responseData.fullName || "",
            email: responseData.email || "",
            phoneNumber: responseData.phoneNumber || "",
            department: responseData.department || "",
            specialization: responseData.specialization || "",
            maxStudents: responseData.maxStudents || 5,
            currentStudents: responseData.currentStudents || 0,
            currentTopics: responseData.currentTopics || 0,
            avt: responseData.avt || "",
          };

          setProfileData(newProfileData);
          setHasInitialData(true);
          // fetched
        }
      } catch (error) {
        console.error("Lỗi khi fetch profile data:", error);
        setError("Không thể tải thông tin profile. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    },
    [hasInitialData]
  );

  // Cập nhật profile data
  const updateProfileData = useCallback((newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  }, []);

  // Load profile data khi component mount - chỉ fetch một lần
  useEffect(() => {
    fetchProfileData(true); // Force fetch lần đầu
  }, [fetchProfileData]);

  const value = {
    profileData,
    isLoading,
    error,
    fetchProfileData,
    updateProfileData,
    hasInitialData,
  };

  return (
    <ProfileTeacherContext.Provider value={value}>
      {children}
    </ProfileTeacherContext.Provider>
  );
};
