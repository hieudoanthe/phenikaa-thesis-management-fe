import { useState, useEffect } from "react";

/**
 * Custom hook để quản lý localStorage
 * @param {string} key - Key trong localStorage
 * @param {any} initialValue - Giá trị ban đầu
 * @returns {Array} - [value, setValue]
 */
const useLocalStorage = (key, initialValue) => {
  // Lấy giá trị từ localStorage hoặc dùng initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Lỗi khi đọc localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Function để set giá trị
  const setValue = (value) => {
    try {
      // Cho phép value là function để có thể dùng setValue(prev => prev + 1)
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Lưu vào state
      setStoredValue(valueToStore);

      // Lưu vào localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Lỗi khi ghi localStorage key "${key}":`, error);
    }
  };

  // Xóa giá trị khỏi localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Lỗi khi xóa localStorage key "${key}":`, error);
    }
  };

  // Lắng nghe thay đổi từ các tab khác
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(
            `Lỗi khi parse localStorage value cho key "${key}":`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
