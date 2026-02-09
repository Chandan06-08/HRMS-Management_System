import { useEffect, useState } from "react";
import "../App.css";

const API = "http://127.0.0.1:8000/api";

export default function AttendancePage() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const res = await fetch(`${API}/employees/`);
    const data = await res.json();
    setEmployees(data);
  };

  const loadAttendance = async (empId) => {
  const res = await fetch(`${API}/attendance/`);
  const data = await res.json();

  const filtered = data.filter(
    (record) => record.employee_id === Number(empId)
  );

  setAttendance(filtered);
};


  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmployee(empId);

    if (empId) {
      loadAttendance(empId);
    } else {
      setAttendance([]);
    }
  };

  return (
    <>
      {/* Waves background */}
      <div className="wave"></div>
      <div className="wave"></div>

      <div className="header">Employee Attendance</div>

      <div className="container">
        <div className="title">Employee-wise Attendance</div>

        <div className="card" style={{ marginBottom: "30px" }}>
          <h3>Select Employee</h3>

          <select value={selectedEmployee} onChange={handleEmployeeChange}>
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h3>Attendance Records</h3>

          {attendance.length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td
                      style={{
                        color: a.status === "Present" ? "green" : "red",
                        fontWeight: 600,
                      }}
                    >
                      {a.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
