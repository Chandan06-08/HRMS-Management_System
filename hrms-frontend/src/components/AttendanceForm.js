import React, { useEffect, useState } from "react";
import API from "../services/api";

function AttendanceForm({ refresh }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee: "",
    date: "",
    status: "Present",
  });

  // Load employees for dropdown
  useEffect(() => {
    API.get("employees/").then((res) => setEmployees(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("attendance/", form);
    setForm({ employee: "", date: "", status: "Present" });
    refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Mark Attendance</h3>

      <select
        name="employee"
        value={form.employee}
        onChange={handleChange}
        required
      >
        <option value="">Select Employee</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.full_name}
          </option>
        ))}
      </select>
      <br />

      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        required
      />
      <br />

      <select name="status" value={form.status} onChange={handleChange}>
        <option value="Present">Present</option>
        <option value="Absent">Absent</option>
      </select>
      <br />

      <button type="submit">Save Attendance</button>
    </form>
  );
}

export default AttendanceForm;
