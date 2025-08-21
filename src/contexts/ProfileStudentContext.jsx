import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getToken, getUserIdFromToken } from "../auth/authUtils";
import userService from "../services/user.service";

// Tạo context cho Student Profile
const ProfileStudentContext = createContext();

// Hook để sử dụng context
export const useProfileStudent = () => {
  const context = useContext(ProfileStudentContext);
  if (!context) {
    throw new Error(
      "useProfileStudent must be used within a ProfileStudentProvider"
    );
  }
  return context;
};

// Provider component
export const ProfileStudentProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    major: "",
    className: "",
    status: 1,
    avt: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Sử dụng hàm getUserIdFromToken từ authUtils
  // const getUserIdFromToken = () => { ... } - Đã xóa, sử dụng từ authUtils

  // Fetch profile data từ API
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("Không thể lấy userId từ token");
      }

      const responseData = await userService.getStudentProfile(userId);

      if (responseData) {
        const normalized = {
          fullName: responseData.fullName || "",
          phoneNumber: responseData.phoneNumber || "",
          status: responseData.status || 1,
          major: responseData.major || "",
          className: responseData.className || "",
          avt: responseData.avt || "",
          studentId: responseData.userId?.toString() || "",
          email: responseData.email || "",
          dateOfBirth: responseData.dateOfBirth || "",
          address: responseData.address || "",
          gpa: responseData.gpa || 0,
          creditsCompleted: responseData.creditsCompleted || 0,
          totalCredits: responseData.totalCredits || 0,
        };

        setProfileData(normalized);
      }
    } catch (error) {
      console.error("Lỗi khi fetch profile data:", error);
      setError("Không thể tải thông tin profile. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật profile data
  const updateProfileData = (newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  // Load profile data khi component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const value = {
    profileData,
    isLoading,
    error,
    fetchProfileData,
    updateProfileData,
  };

  return (
    <ProfileStudentContext.Provider value={value}>
      {children}
    </ProfileStudentContext.Provider>
  );
};
