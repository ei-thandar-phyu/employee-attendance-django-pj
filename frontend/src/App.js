//import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import DeptAttendance from './components/DeptAttendance';
import AllDeptAttendance from './components/AllDeptAttendance';
import Home from './components/Home';
import LeaveRequestForm from './components/LeaveRequestForm';
import PasswordChange from './components/PasswordChange';
import LeaveApproval from './components/LeaveApproval';
import AllLeaveApproval from './components/AllLeaveApproval';
import ManageEmployees from './components/ManageEmployees';

function App() {
  //✅ Get CSRF token on app start
  // useEffect(() => {
  //   fetch('http://127.0.0.1:8000/api/csrf-token/', {
  //     credentials: 'include',
  //   });
  // }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/home" element={<Home />} />
        <Route path="/leave-request-form" element={<LeaveRequestForm />} />
        <Route path="/change-password" element={<PasswordChange />} />

        <Route path="/dept-attendance" element={<DeptAttendance />} />
        <Route path="/leave-approval" element={<LeaveApproval />} />

        <Route path="/all-dept-attendance" element={<AllDeptAttendance />} />
        <Route path="/all-employees" element={<ManageEmployees />} />
        <Route path="/all-leave-approval" element={<AllLeaveApproval />} />

        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
    </Router>
  );
}

export default App;
