import React, { useEffect, useState } from "react";
import API from "../services/api";
import AttendanceForm from "./AttendanceForm";

function AttendanceList() {
  const [records, setRecords] = useState([]);

  const loadAttendance = async () => {
    const res = await API.get("attendance/");
    setRecords(res.data);
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  return (
    <div>
      <AttendanceForm refresh={loadAttendance} />

      <h3>Attendance Records</h3>

      {records.length === 0 ? (
        <p>No attendance records</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.employee}</td>
                <td>{rec.date}</td>
                <td>{rec.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AttendanceList;
