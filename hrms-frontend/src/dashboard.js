import { useEffect, useState } from "react";
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Bell, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const API = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
console.log("HRMS Connected to API:", API);

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState({ show: false, status: '', override: false });
  const [attendanceState, setAttendanceState] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    department: "",
    role: "",
    shift: "",
    profile_image: ""
  });

  const initApp = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadEmployees(), loadAttendance(), loadShifts()]);
    } catch (err) { setError("Failed to connect to backend"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    initApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    syncAttendanceToState();
  }, [employees, attendance, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncAttendanceToState = () => {
    const newState = {};
    employees.forEach(emp => {
      const record = attendance.find(a => a.employee === emp.id && a.date === selectedDate);
      newState[emp.id] = {
        status: record ? (record.status === 'On-time' ? 'PRESENT' : record.status.toUpperCase()) : "PENDING",
        isBulkAction: false
      };
    });
    setAttendanceState(newState);
  };

  const loadShifts = async () => {
    try {
      const res = await fetch(`${API}/shifts/`);
      // Shifts data is fetched but kept for future use in employee creation
      await res.json();
    } catch (err) { console.error("Err loading shifts", err); }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API}/employees/`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) { console.error("Err loading employees", err); }
  };

  const loadAttendance = async () => {
    try {
      const res = await fetch(`${API}/attendance/`);
      const data = await res.json();
      setAttendance(data);
    } catch (err) { console.error("Err loading attendance", err); }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addEmployee = async (e) => {
    e.preventDefault();
    const dataToSend = { ...form };
    if (!dataToSend.profile_image) delete dataToSend.profile_image;

    try {
      await fetch(`${API}/employees/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      setShowAddModal(false);
      setForm({
        employee_id: "",
        full_name: "",
        email: "",
        department: "",
        role: "",
        shift: "",
        profile_image: ""
      });
      loadEmployees();
    } catch (err) { console.error("Err adding employee", err); }
  };

  // Dynamic Stats
  const totalEmployees = employees.length;
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(a => a.date === today && (a.status === 'On-time' || a.status === 'Present')).length;
  const absentToday = attendance.filter(a => a.date === today && a.status === 'Absent').length;

  const markAttendance = async (empId, status) => {
    // Optimistic Update
    setAttendanceState(prev => ({
      ...prev,
      [empId]: { status: status.toUpperCase(), isBulkAction: false }
    }));

    try {
      const res = await fetch(`${API}/attendance/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: empId,
          date: selectedDate,
          status: status === 'Present' ? 'On-time' : status, // Keep 'On-time' for backend compatibility or use 'Present'
          check_in_time: status === 'Absent' ? null : new Date().toLocaleTimeString('en-GB')
        }),
      });
      if (!res.ok) throw new Error("Failed to sync");
      loadAttendance();
    } catch (err) {
      console.error("Err marking attendance", err);
      syncAttendanceToState(); // Revert on failure
    }
  };

  const finalizeReport = () => {
    const unmarked = Object.values(attendanceState).some(s => s.status === 'PENDING');
    if (unmarked) {
      alert("⚠️ Some employees are still unmarked. Please complete the attendance before finalizing.");
      return;
    }

    const stats = Object.values(attendanceState).reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    alert(`🎉 Attendance Report Finalized for ${selectedDate}!\n\nTotal Employees: ${employees.length}\n✅ Present: ${stats['PRESENT'] || stats['ON-TIME'] || 0}\n❌ Absent: ${stats['ABSENT'] || 0}\n\nDaily report has been synced with the database.`);
  };

  const bulkMarkAttendance = (status) => {
    const stats = Object.values(attendanceState);
    const hasIndividuals = stats.some(s => s.status !== 'PENDING' && !s.isBulkAction);
    setShowBulkConfirm({ show: true, status, override: hasIndividuals });
  };

  const handleBulkAction = async () => {
    const { status } = showBulkConfirm;
    setShowBulkConfirm({ show: false, status: '', override: false });

    // Batch Update Local State
    const updatedState = { ...attendanceState };
    employees.forEach(emp => {
      updatedState[emp.id] = { status: status.toUpperCase(), isBulkAction: true };
    });
    setAttendanceState(updatedState);

    setLoading(true);
    const promises = employees.map(emp => {
      return fetch(`${API}/attendance/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: emp.id,
          date: selectedDate,
          status: status === 'Present' ? 'On-time' : status,
          check_in_time: status === 'Absent' ? null : new Date().toLocaleTimeString('en-GB')
        }),
      });
    });
    try {
      await Promise.all(promises);
      await loadAttendance();
    } catch (err) {
      console.error("Err bulk marking", err);
      syncAttendanceToState();
    }
    finally { setLoading(false); }
  };

  const downloadReport = (emp) => {
    const empAttendance = attendance.filter(a => a.employee === emp.id);
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Status,Check-in,Check-out\n"
      + empAttendance.map(a => `${a.date},${a.status},${a.check_in_time},${a.check_out_time}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${emp.full_name}_Report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Process data for chart - Grouping by last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => ({
    name: date.split('-')[2], // Day only
    present: attendance.filter(a => a.date === date && (a.status === 'On-time' || a.status === 'Present')).length,
    absent: attendance.filter(a => a.date === date && a.status === 'Absent').length,
  }));

  // Render logic for different tabs
  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Synching with Secure Hub...</p>
      </div>
    );

    if (error) return (
      <div className="card" style={{ borderColor: 'var(--danger)', background: '#fef2f2', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)' }}>Connection Offline</h3>
        <p>{error}. Please ensure Django server is running.</p>
        <button className="btn-primary" onClick={initApp} style={{ marginTop: '1rem' }}>Retry Connection</button>
      </div>
    );

    switch (activeTab) {
      case 'employees':
        return (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Human Resources</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage employee directory</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                  <input
                    type="text"
                    placeholder="Search name, ID, or dept..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} /> Add Employee
                </button>
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No employees match your search.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Attendance Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const dayRecord = attendance.find(a => a.employee === emp.id && a.date === today);
                    return (
                      <tr key={emp.id} className="table-row-hover">
                        <td><code>{emp.employee_id}</code></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={emp.profile_image || `https://ui-avatars.com/api/?name=${emp.full_name}&background=6366f1&color=fff`} width={36} height={36} style={{ borderRadius: '10px' }} alt={emp.full_name} />
                            <div style={{ fontWeight: 600 }}>{emp.full_name}</div>
                          </div>
                        </td>
                        <td><span className="dept-tag">{emp.department}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{emp.role}</td>
                        <td>
                          <span className={`status-badge ${dayRecord ? (dayRecord.status === 'Absent' ? 'status-offline' : 'status-online') : ''}`} style={{ background: !dayRecord ? '#f1f5f9' : undefined, color: !dayRecord ? '#64748b' : undefined }}>
                            {dayRecord ? dayRecord.status : 'Not Marked'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => downloadReport(emp)}>Report</button>
                            <button className="btn-secondary" style={{ padding: '4px 8px', borderColor: 'var(--border)' }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      case 'attendance':
        const attendanceFilteredEmployees = employees.filter(emp =>
          emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const hasBulkApplied = Object.values(attendanceState).some(s => s.isBulkAction);

        return (
          <div className="card">
            {/* BULK ACTION BANNER */}
            {hasBulkApplied && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e40af' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Bulk action applied – review before final submission</span>
              </div>
            )}

            <div className="flex-between" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.5rem' }}>Daily Attendance</h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Date-wise employee tracking</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: '12px' }}
                  />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                </div>

                <div style={{ background: '#f1f5f9', padding: '0.4rem', borderRadius: '14px', display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ padding: '0.5rem 0.8rem', border: 'none', background: 'white', borderRadius: '10px', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} onClick={() => bulkMarkAttendance('Present')}>All Present</button>
                  <button className="btn-primary" style={{ background: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} onClick={() => bulkMarkAttendance('Absent')}>All Absent</button>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Employee Profile</th>
                    <th>ID</th>
                    <th>Live Status</th>
                    <th style={{ textAlign: 'center' }}>Action Panel</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceFilteredEmployees.map(emp => {
                    const state = attendanceState[emp.id] || { status: 'PENDING', isBulkAction: false };
                    const isMarked = state.status !== 'PENDING';

                    const getStatusColor = (status) => {
                      switch (status) {
                        case 'PRESENT':
                        case 'ON-TIME': return { bg: '#dcfce7', text: '#15803d', border: '#bcf0da' };
                        case 'ABSENT': return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
                        default: return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
                      }
                    };
                    const colors = getStatusColor(state.status);

                    return (
                      <tr key={emp.id} className={`table-row-hover ${isMarked ? 'attendance-marked-row' : ''}`} style={{ background: isMarked ? '#f8fafc' : 'transparent' }}>
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                              <img src={emp.profile_image || `https://ui-avatars.com/api/?name=${emp.full_name}&background=6366f1&color=fff`} width={42} height={42} style={{ borderRadius: '12px', objectFit: 'cover', opacity: isMarked ? 0.8 : 1 }} alt={emp.full_name} />
                              {isMarked && (
                                <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#10b981', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '10px', display: 'grid', placeItems: 'center', border: '2px solid white' }}>✓</div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isMarked ? 'var(--text-muted)' : 'var(--text-main)' }}>{emp.full_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                            </div>
                          </div>
                        </td>
                        <td><code style={{ fontSize: '0.875rem', opacity: isMarked ? 0.6 : 1 }}>{emp.employee_id}</code></td>
                        <td>
                          <span className="status-badge"
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}>
                            {state.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className="btn-mark"
                              style={{
                                background: (state.status === 'PRESENT' || state.status === 'ON-TIME') ? '#10b981' : 'white',
                                color: (state.status === 'PRESENT' || state.status === 'ON-TIME') ? 'white' : '#166534',
                                border: `1px solid ${(state.status === 'PRESENT' || state.status === 'ON-TIME') ? '#10b981' : '#bcf0da'}`,
                                fontWeight: 700,
                                opacity: state.status === 'PENDING' || state.status === 'PRESENT' || state.status === 'ON-TIME' ? 1 : 0.4,
                                boxShadow: (state.status === 'PRESENT' || state.status === 'ON-TIME') ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                transform: (state.status === 'PRESENT' || state.status === 'ON-TIME') ? 'scale(1.05)' : 'scale(1)'
                              }}
                              onClick={() => markAttendance(emp.id, 'Present')}
                            >
                              Present
                            </button>
                            <button
                              className="btn-mark"
                              style={{
                                background: state.status === 'ABSENT' ? '#ef4444' : 'white',
                                color: state.status === 'ABSENT' ? 'white' : '#991b1b',
                                border: `1px solid ${state.status === 'ABSENT' ? '#ef4444' : '#fecaca'}`,
                                fontWeight: 700,
                                opacity: state.status === 'PENDING' || state.status === 'ABSENT' ? 1 : 0.4,
                                boxShadow: state.status === 'ABSENT' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                                transform: state.status === 'ABSENT' ? 'scale(1.05)' : 'scale(1)'
                              }}
                              onClick={() => markAttendance(emp.id, 'Absent')}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '1.25rem', border: '2px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Marked Progress</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {Object.values(attendanceState).filter(s => s.status !== 'PENDING').length} <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>/ {employees.length} Employees</span>
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }}></div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Efficiency Total</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    {employees.length > 0 ? Math.round((Object.values(attendanceState).filter(s => s.status !== 'PENDING').length / employees.length) * 100) : 0}%
                  </div>
                </div>
              </div>
              <button
                className="btn-primary"
                style={{
                  padding: '0.8rem 2.5rem',
                  borderRadius: '14px',
                  background: Object.values(attendanceState).filter(s => s.status !== 'PENDING').length === employees.length ? 'var(--primary)' : '#cbd5e1',
                  boxShadow: Object.values(attendanceState).filter(s => s.status !== 'PENDING').length === employees.length ? '0 8px 20px rgba(99, 102, 241, 0.3)' : 'none',
                  cursor: Object.values(attendanceState).filter(s => s.status !== 'PENDING').length === employees.length ? 'pointer' : 'not-allowed',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9375rem'
                }}
                disabled={activeTab === 'attendance' && Object.values(attendanceState).filter(s => s.status !== 'PENDING').length !== employees.length}
                onClick={finalizeReport}
              >
                Finalize & Post Daily Report
              </button>
            </div>

            {/* BULK ACTION CONFIRMATION MODAL */}
            {showBulkConfirm.show && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {showBulkConfirm.status === 'Present' ? <CheckCircle2 size={64} color="#10b981" /> : <AlertCircle size={64} color="#ef4444" />}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Bulk Attendance Confirm
                  </h3>

                  {showBulkConfirm.override && (
                    <div style={{ background: '#fff7ed', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffedd5', color: '#9a3412', fontSize: '0.8125rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', textAlign: 'left' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span><strong>Warning:</strong> This will override individual attendance selections you have already made.</span>
                    </div>
                  )}

                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Are you sure you want to mark <strong>ALL ({employees.length})</strong> employees as
                    <span style={{ color: showBulkConfirm.status === 'Present' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {" "}{showBulkConfirm.status === 'Present' ? 'PRESENT' : 'ABSENT'}
                    </span>?
                  </p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, padding: '0.75rem' }}
                      onClick={() => setShowBulkConfirm({ show: false, status: '', override: false })}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: showBulkConfirm.status === 'Present' ? '#10b981' : '#ef4444'
                      }}
                      onClick={handleBulkAction}
                    >
                      Confirm All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="card">
            <h3 className="card-title">Monthly Reports</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select an employee to download their attendance history.</p>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {employees.map(emp => (
                <div key={emp.id} className="stat-item" style={{ background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                  <img src={emp.profile_image || `https://ui-avatars.com/api/?name=${emp.full_name}`} width={48} height={48} style={{ borderRadius: '50%' }} alt={emp.full_name} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{emp.full_name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.employee_id} • {emp.department}</p>
                  </div>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }} onClick={() => downloadReport(emp)}>Export CSV</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="card">
            <h3 className="card-title">System Settings</h3>
            <p style={{ color: 'var(--text-muted)' }}>Configure your HRMS settings here.</p>
          </div>
        );
      default:
        // ... (Dashboard remains the same)
        return (
          <div className="dashboard-grid">
            {/* LEFT COLUMN */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* CHART CARD */}
              <div className="card">
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>Attendance Status</h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> Present
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></div> Absent
                    </span>
                  </div>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* LOWER STATS AND NEW PROFILE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                  <div className="flex-between">
                    <h3 className="card-title">Total Employees: {totalEmployees}</h3>
                    <a href="#!" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Total Count</a>
                  </div>
                  <div className="list-container">
                    <div style={{ padding: '1rem 0' }}>
                      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Present Today</span>
                        <span style={{ fontWeight: 600 }}>{presentToday}</span>
                      </div>
                      <div className="flex-between">
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Absent Today</span>
                        <span style={{ fontWeight: 600 }}>{absentToday}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#f8fafc', borderStyle: 'dashed' }}>
                  <img src="https://img.freepik.com/free-vector/choice-worker-concept_23-2148626348.jpg" height={120} alt="Add profile" style={{ marginBottom: '1rem', mixBlendMode: 'multiply' }} />
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveTab('employees')}>
                    <Plus size={16} /> Add new profile
                  </button>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h3 className="card-title">Department Distribution</h3>
                <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {['Design', 'Development', 'Data Science', 'HR'].map(dept => {
                    const deptEmployees = employees.filter(e => e.department === dept).length;
                    return (
                      <div key={dept} className="stat-item" style={{ border: '1px solid var(--border)', background: 'white' }}>
                        <div className="flex-between">
                          <div>
                            <div className="stat-value">{deptEmployees}</div>
                            <div className="stat-label">{dept}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                            <div style={{ color: 'var(--text-muted)' }}>Staff Members</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="flex-between">
                  <h3 className="card-title">Recent Activity</h3>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('employees')}>View all</div>
                </div>
                <div className="list-container">
                  {employees.length > 0 ? employees.slice(0, 4).map(emp => (
                    <div className="list-item" key={emp.id}>
                      <img src={emp.profile_image || `https://ui-avatars.com/api/?name=${emp.full_name}`} width={40} height={40} style={{ borderRadius: '50%' }} alt={emp.full_name} />
                      <div className="item-info">
                        <h4>{emp.full_name}</h4>
                        <p>{emp.role || emp.department}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Check-in</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No employees found</div>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div style={{ width: 32, height: 32, background: 'white', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--primary)', fontWeight: 800 }}>H</div>
          <span style={{ color: 'white' }}>HRMS Pro</span>
        </div>
        <nav className="nav-links">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <Users size={20} /> Employees
          </button>
          <button className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <Calendar size={20} /> Attendance
          </button>
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <BarChart size={20} /> Reports
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: '#fca5a5' }}><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOP NAV */}
        <header className="top-nav">
          <div className="page-title" style={{ textTransform: 'capitalize' }}>
            {activeTab} Overview
          </div>
          <div className="user-profile">
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="var(--text-muted)" />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'red', borderRadius: '50%' }}></span>
            </div>
            <div className="user-profile">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Admin User</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Super Admin</div>
              </div>
              <img src="https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff" alt="User" className="profile-img" />
            </div>
          </div>
        </header>

        {renderContent()}
      </main>

      {/* MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="card-title">Add New Employee</h3>
            <form onSubmit={addEmployee}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee ID</label>
                  <input required value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. EMP001" />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. john@example.com" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select Dept</option>
                    <option>Design</option>
                    <option>Development</option>
                    <option>Data Science</option>
                    <option>HR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. UI Designer" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Profile Image URL (Optional)</label>
                  <input value={form.profile_image} onChange={e => setForm({ ...form, profile_image: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="flex-between mt-4" style={{ gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
