import React, { useState, useEffect } from 'react';
import { FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import Calendar from './Calendar';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getCookie } from './utils';

const Home = () => {
  const employeeName = localStorage.getItem('employeeName');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockedOut, setClockedOut] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshCalendar, setRefreshCalendar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/home/', {
            method: 'GET',
            credentials: 'include',
          })
  
          if (response.status === 403) {
            alert('Access denied. Please log in first.');
            return;
          }
  
          const data = await response.json();
          //setDashboardData(data);
          setClockedIn(data.clocked_in);
          setClockedOut(data.clocked_out);
          setClockInTime(data.clock_in_time);
          setClockOutTime(data.clock_out_time);
        } catch (err) {
          console.log(err)
          alert('Failed to fetch dashboard data.');
        }
      };
      fetchDashboardData();
    }, []);
  
  const handleClockIn = async () => {
    const response = await fetch('http://localhost:8000/api/clock-in/', {
      method: 'POST',
      credentials: 'include',
      headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
      }
    });
    const data = await response.json();
    console.log(data)
    setClockedIn(data.clocked_in);
    setClockInTime(data.clock_in_time);
  };

  const handleClockOut = async () => {
    const response = await fetch('http://localhost:8000/api/clock-out/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      }
    });
    const data = await response.json();
    setClockedOut(data.clocked_out);
    setClockOutTime(data.clock_out_time);
    setRefreshCalendar(prev => !prev); // calendar update
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
        headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      }
      });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.clear();
      navigate('/');
    }
  };

  
  return (
    <div className="dashboard-container">
      {/* Side Panel */}
      <div className="side-panel">
        <div className="company-logo">
          <h2>AttendancePro</h2>
        </div>
        <nav className="nav-menu">
          <ul>                     
            <li className="active"><a href="/home"> <FaHome className="icon" /> Home</a></li>
            <li><a href="/leave-request-form"> <FcLeave className="icon" /> Leave </a></li>
          </ul>

          {localStorage.getItem('role') !== 'staff' && (
            <>
              <h5> Management </h5>
              <ul>
                <li><a href={getAttendanceLink()}> <FaChartBar className="icon" /> Attendance</a></li>
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
          <h1>Home</h1>
          <div className="user-info">
            <span><strong>{employeeName}</strong></span>
          </div>
        </header>

        {/* Date and Time Display */}
        <div className="datetime-container">
          <div className="today">Today</div>
          <div className="current-date">{formatDate(currentTime)}</div>
          <div className="current-time">{currentTime.toLocaleTimeString()}</div>
        </div>

        {/* Attendance Actions */}
        <div className="attendance-actions">
          <div className="clock-in-section">
            <button 
              onClick={handleClockIn} 
              disabled={clockedIn}
              className={clockedIn ? 'disabled' : ''}
            >
              Clock In
            </button>
            <div className="time-info">
              <span>Clock In Time:</span>
              <strong>{clockInTime || '---'}</strong>
            </div>
          </div>

          <div className="clock-out-section">
            <button 
              onClick={handleClockOut} 
              disabled={!clockedIn | clockedOut}
              className={(!clockedIn | clockedOut) ? 'disabled' : ''}
            >
              Clock Out
            </button>
            <div className="time-info">
              <span>Clock Out Time:</span>
              <strong>{clockOutTime || '---'}</strong>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <Calendar refresh={refreshCalendar} />
      </div>
    </div>
  );
};

export default Home;