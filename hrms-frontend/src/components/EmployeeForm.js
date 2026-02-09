import React, { useState } from "react";
import API from "../services/api";

function EmployeeForm({ refresh }) {
  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    department: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("employees/", form);
    setForm({ employee_id: "", full_name: "", email: "", department: "" });
    refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Employee</h3>

      <input
        name="employee_id"
        placeholder="Employee ID"
        value={form.employee_id}
        onChange={handleChange}
      /><br />

      <input
        name="full_name"
        placeholder="Full Name"
        value={form.full_name}
        onChange={handleChange}
      /><br />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      /><br />

      <input
        name="department"
        placeholder="Department"
        value={form.department}
        onChange={handleChange}
      /><br />

      <button type="submit">Add</button>
    </form>
  );
}

export default EmployeeForm;
