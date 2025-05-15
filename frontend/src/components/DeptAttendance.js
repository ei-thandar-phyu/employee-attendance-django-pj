import React, { useState, useEffect } from 'react';
import { FaUserClock, FaUserCheck, FaUserTimes, FaUserMinus, FaCalendarAlt,  FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import './DeptAttendance.css';
import { useNavigate } from 'react-router-dom';
import { getCookie } from './utils';

const DeptAttendance = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const department = localStorage.getItem('dept');
  
  const [totalEmployees, setTotalEmployees] = useState('');
  const [attendanceSummary, setAttendancSummary] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  const statusColors = {
        'ON_TIME': '#2ecc71',
        'LATE': '#f39c12',
        'FULL_LEAVE': '#3498db',
        'AM_LEAVE': '#3498db',
        'PM_LEAVE': '#3498db',
        'ABSENT': '#e74c3c'
  };

  const generateAttendanceData = async () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    console.log(department,formattedDate)

    try {
      const response = await fetch(
        `http://localhost:8000/api/dept-attendance/?department=${department}&date=${formattedDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data)
      setTotalEmployees(data.total_employees)
      setAttendancSummary(data.attendance_summary)
      setAttendanceData(data.attendance_logs);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    }
  };

  useEffect(() => {
    generateAttendanceData(selectedDate);
  }, [department, selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAttendanceLink = () => {
    if (localStorage.getItem('role') === 'manager') {
      return '/dept-attendance';
    } else {
      return '/all-dept-attendance';
    }
  };

  const getLeaveLink = () => {
    if (localStorage.getItem('role') === 'manager') {
      return '/leave-approval';
    } else {
      return '/all-leave-approval';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout/', {
        method: 'POST',
        credentials: 'include',
        
      });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="dept-attendance">
      {/* Side Panel */}
      <div className="side-panel">
        <div className="company-logo">
          <h2>AttendancePro</h2>
        </div>
        <nav className="nav-menu">
          <ul>                     
            <li><a href="/home"> <FaHome className="icon" /> Home</a></li>
            <li><a href="/leave-request-form"> <FcLeave className="icon" /> Leave </a></li>
          </ul>

          {localStorage.getItem('role') !== 'staff' && (
            <>
              <h5> Management </h5>
              <ul>
                <li className="active"><a href={getAttendanceLink()}> <FaChartBar className="icon" /> Attendance</a></li>
                <li><a href={getLeaveLink()}><MdEditCalendar className="icon" /> Leave Approval</a></li>
            </ul>
            </>
          )}
          {localStorage.getItem('role') !== 'staff' && localStorage.getItem('role') !== 'manager' && (
            <>
              <ul>
                <li><a href="/all-employees"> <FaChartBar className="icon" /> Employees</a></li>
                
            </ul>
            </>
          )}

          <h5> Settings </h5>
          <ul>                     
            <li><a href="/change-password"> <TbLockPassword className="icon" /> Change Password </a></li>
            <li>
              <a href="#" onClick={handleLogout}>
                <MdLogout className="icon" />  Logout
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="page-header">
          <h1>Attendance ({department}) </h1>
          <div className="header-actions">            
            <div className="date-selector">
              <FaCalendarAlt className="calendar-icon" />
              <input 
                type="date"
                max={new Date().toISOString().split('T')[0]} 
                value={selectedDate.toISOString().split('T')[0]} 
                onChange={(e) => handleDateChange(new Date(e.target.value))}
              />
            </div>
            {/* <div className="current-date">{formatDate(selectedDate)}</div> */}
            <div className="date-display">
              {formatDate(selectedDate)}
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card total">
            <div className="stat-icon">
              <FaUserClock />
            </div>
            <div className="stat-info">
              <h3>Total Employees</h3>
              <p>{totalEmployees}</p>
            </div>
          </div>

          <div className="stat-card on-time">
            <div className="stat-icon">
              <FaUserCheck />
            </div>
            <div className="stat-info">
              <h3>On Time</h3>
              <p>{attendanceSummary.on_time}</p>
            </div>
          </div>

          <div className="stat-card late">
            <div className="stat-icon">
              <FaUserClock />
            </div>
            <div className="stat-info">
              <h3>Late</h3>
              <p>{attendanceSummary.late}</p>
            </div>
          </div>

          <div className="stat-card leave">
            <div className="stat-icon">
              <FaUserMinus />
            </div>
            <div className="stat-info">
              <h3>Leave</h3>
              <div className="leave-row">
                <div className="leave-type">
                  <h5>Full Day</h5>
                  <p>{attendanceSummary.full_leave}</p>
                </div>
                <div className="leave-type">
                  <h5>Morning</h5>
                  <p>{attendanceSummary.am_leave}</p>
                </div>
                <div className="leave-type">
                  <h5>Afternoon</h5>
                  <p>{attendanceSummary.pm_leave}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card absent">
            <div className="stat-icon">
              <FaUserTimes />
            </div>
            <div className="stat-info">
              <h3>Absent</h3>
              <p>{attendanceSummary.absent}</p>
            </div>
          </div>
        </div>

        {/* Attendance Sheet */}
        <div className="attendance-sheet">
          <div className="section-header">
            <h2>Attendance Sheet</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Clock In Method</th>
                  <th>Clock Out Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.clock_in_time}</td>
                    <td>{employee.clock_out_time}</td>
                    <td>{employee.clock_in_method}</td>
                    <td>{employee.clock_out_method}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: statusColors[employee.status] }}
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeptAttendance;