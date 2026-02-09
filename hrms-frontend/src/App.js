import { Routes, Route } from "react-router-dom";
import Dashboard from "./dashboard";
import AttendancePage from "./pages/AttendancePage";
import "./App.css";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<AttendancePage />} />
      </Routes>
    </>
  );
}

export default App;
