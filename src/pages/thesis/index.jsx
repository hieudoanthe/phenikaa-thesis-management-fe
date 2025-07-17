import React, { useEffect, useState } from "react";

const ThesisList = () => {
  const [theses, setTheses] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8082/thesis-service/api/thesis/all")
      .then((res) => res.json())
      .then((data) => setTheses(data))
      .catch((error) => console.error("Lỗi khi fetch dữ liệu:", error));
  }, []);

  const handleDelete = (id) => {
    fetch(`http://localhost:8082/thesis-service/api/thesis/delete/${id}`, {
      method: "DELETE",
    });
  };

  return (
    <div>
      <h1>Luận văn</h1>
      <ul>
        {theses.map((item) => (
          <li key={item.id}>
            {item.title} - {item.author}
            <button>Xem chi tiết</button>
            <button className="btn-delete" onClick={() => handleDelete(item.id)}>Xóa</button>
            <button>Sửa</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThesisList;
