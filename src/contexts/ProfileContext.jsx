import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { getUserIdFromToken, getTeacherIdFromToken } from "../auth/authUtils";
import userService from "../services/user.service";

const ProfileContext = createContext();


export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile phải được sử dụng trong một ProfileProvider");
  }
  return context;
};

export const useProfileStudent = () => {
  const context = useProfile();
  if (context.userType !== "student") {
    throw new Error(
      'useProfileStudent phải được sử dụng trong một ProfileProvider với userType="student"'
    );
  }
  return context;
};

export const useProfileTeacher = () => {
  const context = useProfile();
  if (context.userType !== "teacher") {
    throw new Error(
      'useProfileTeacher phải được sử dụng trong một ProfileProvider với userType="teacher"'
    );
  }
  return context;
};

const normalizeProfileData = (data, userType) => {
  const baseData = {
    fullName: data.fullName || "",
    email: data.email || "",
    phoneNumber: data.phoneNumber || "",
    avt: data.avt || data.avatar || "",
  };

  switch (userType) {
    case "teacher":
      return {
        ...baseData,
        department: data.department || "",
        specialization: data.specialization || "",
        degree: data.degree || "",
        maxStudents: data.maxStudents || 15,
        currentStudents: data.currentStudents || 0,
        currentTopics: data.currentTopics || 0,
        academicRank: data.academicRank || "Giảng viên",
      };
    case "admin":
      return {
        ...baseData,
        role: data.role || "admin",
        permissions: data.permissions || [],
        department: data.department || "",
      };
    default: // student
      return {
        ...baseData,
        major: data.major || "",
        className: data.className || data.class || "",
        status: data.status || 1,
        studentId: data.userId?.toString() || "",
        dateOfBirth: data.dateOfBirth || "",
        address: data.address || "",
        gpa: data.gpa || 0,
        creditsCompleted: data.creditsCompleted || 0,
        totalCredits: data.totalCredits || 0,
      };
  }
};

const getUserId = (userType) => {
  switch (userType) {
    case "teacher":
      return getTeacherIdFromToken();
    case "admin":
      return getUserIdFromToken(); 
    default:
      return getUserIdFromToken();
  }
};

const fetchProfileFromAPI = async (userId, userType) => {
  switch (userType) {
    case "teacher": {
      const teacherResponse = await userService.getTeacherProfile(userId);
      return teacherResponse?.data || teacherResponse;
    }
    case "admin": {
      // Assuming admin profile endpoint exists
      const adminResponse = await userService.getAdminProfile?.(userId);
      return adminResponse?.data || adminResponse;
    }
    default: {
      const studentResponse = await userService.getStudentProfile(userId);
      return studentResponse;
    }
  }
};

export const ProfileProvider = ({ children, userType = "student" }) => {
  const [profileData, setProfileData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialData, setHasInitialData] = useState(false);

  const fetchProfileData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (hasInitialData && !forceRefresh) {
          return;
        }

        setIsLoading(true);
        setError(null);

        const userId = getUserId(userType);
        if (!userId) {
          throw new Error("Không thể lấy userId từ token");
        }

        const responseData = await fetchProfileFromAPI(userId, userType);

        if (responseData) {
          const normalized = normalizeProfileData(responseData, userType);
          setProfileData(normalized);
          setHasInitialData(true);
        }
      } catch (error) {
        console.error("Lỗi khi fetch profile data:", error);
        setError("Không thể tải thông tin profile. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    },
    [userType, hasInitialData]
  );


  const updateProfileData = useCallback((newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  }, []);

  useEffect(() => {
    fetchProfileData(true); 
  }, [fetchProfileData]);

  const value = useMemo(
    () => ({
      profileData,
      isLoading,
      error,
      fetchProfileData,
      updateProfileData,
      hasInitialData,
      userType,
    }),
    [
      profileData,
      isLoading,
      error,
      fetchProfileData,
      updateProfileData,
      hasInitialData,
      userType,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};


ProfileProvider.propTypes = {
  children: PropTypes.node.isRequired,
  userType: PropTypes.oneOf(["student", "teacher", "admin"]),
};
