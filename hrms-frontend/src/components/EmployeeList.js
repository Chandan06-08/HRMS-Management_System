import React, { useEffect, useState } from "react";
import API from "../services/api";
import EmployeeForm from "./EmployeeForm";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);

  const loadEmployees = async () => {
    const res = await API.get("employees/");
    setEmployees(res.data);
  };

  const deleteEmployee = async (id) => {
    await API.delete(`employees/${id}/`);
    loadEmployees();
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <div>
      <EmployeeForm refresh={loadEmployees} />
      <h3>Employees</h3>

      {employees.length === 0 ? (
        <p>No employees found</p>
      ) : (
        <ul>
          {employees.map((emp) => (
            <li key={emp.id}>
              {emp.full_name} ({emp.department})
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => deleteEmployee(emp.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmployeeList;
