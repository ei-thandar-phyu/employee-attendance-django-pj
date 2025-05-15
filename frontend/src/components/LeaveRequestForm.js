import React, { useState, useEffect } from 'react';
import './LeaveRequestForm.css';
import { FaTrash, FaCheck, FaTimes, FaClock, FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCookie } from './utils';

const LeaveRequestForm = () => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    leaveDuration: '',
    reason: ''
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const employeeName = localStorage.getItem('employeeName');
  
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/available-leave/', { withCredentials: true })
      .then(res => setLeaveTypes(res.data.leave_types))
      .catch(err => console.error('Failed to fetch leave types:', err));
  
    fetchLeaveBalances();
    fetchLeaveHistory();

  }, []);

  const [leaveBalances, setLeaveBalances] = useState([]);
  const fetchLeaveBalances = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/leave-balances', {
        credentials: 'include',
      });
      const data = await response.json();
      setLeaveBalances(data.leave_balances);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };
  
  const LeaveDaysCard = ({ leaveBalances }) => {
    return (
      <div className="leave-days-card">
        <h3>Leave Taken</h3>
        <div className="leave-days-list">
          {leaveBalances.map((leave) => (
            <div key={leave.name} className="leave-item">
              <div className="leave-type">{leave.name}</div>
              <div className="leave-days">
                <span className="used">{leave.used_days}</span>
                <span className="separator">/</span>
                <span className="total">{leave.total_days}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // leave history data
  const [leaveHistory, setLeaveHistory] = useState([]);
  const fetchLeaveHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/leave-history', {
        credentials: 'include',
      });
      const data = await response.json();
      setLeaveHistory(data.leave_history);
    } catch (error) {
      console.error('Error fetching leave history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    const startday = new Date(formData.startDate).getDay();
    if (startday === 0 || startday === 6) newErrors.startDate = 'Start date cannot be a holiday';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    const endday = new Date(formData.endDate).getDay();
    if (endday === 0 || endday === 6) newErrors.endDate = 'Start date cannot be a holiday';
    if (!formData.leaveType) newErrors.leaveType = 'Leave type is required';
    if (!formData.leaveDuration) newErrors.leaveDuration = 'Leave Duration is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) newErrors.endDate = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      setTimeout(async () => {
        const newLeave = {
          start_date: formData.startDate,
          end_date: formData.endDate,
          leave_type: formData.leaveType,
          leave_duration: formData.leaveDuration,
          reason: formData.reason,
        };

        console.log(newLeave)
        
        try {
          const response = await fetch('http://localhost:8000/api/leave-request/submit', {
              method: 'POST',
              credentials: 'include',
              headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': getCookie('csrftoken'),
              },
              body: JSON.stringify(newLeave),
          });
          
          const data = await response.json();
          if (!response.ok) {
              alert(data.error || 'Failed to submit the leave request.');
              setIsSubmitting(false);
          } else{
              setLeaveHistory([data.new_leave, ...leaveHistory]);
              setFormData({
                startDate: '',
                endDate: '',
                leaveType: '',
                leaveDuration: '',
                reason: ''
              });
              setIsSubmitting(false);
              setShowSuccess(true);
              
              setTimeout(() => setShowSuccess(false), 5000);
            }
        } catch (e) {
            alert(e.message);
            setIsSubmitting(false);
            console.error('Error:', e);
        }
      }, 1500);
    }
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async(id) => {
    try {
       const response = await fetch(`http://localhost:8000/api/leave-requests/${id}/cancel/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
        });

      if (response.ok) {
        fetchLeaveHistory();
        setShowDeleteConfirm(null);
        console.log('Leave request cancelled successfully');
      } else {
        const data = await response.json();
        alert(data.message)
        console.error('Failed to cancel leave request:', data);
      }
    } catch (e) {
      alert(e.message)
      console.error('Error cancelling leave request:', e);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge approved"><FaCheck /> Approved</span>;
      case 'REJECTED':
        return <span className="badge rejected"><FaTimes /> Rejected</span>;
      case 'PENDING':
        return <span className="badge pending"><FaClock /> Pending</span>;
      case 'CANCELLED':
        return <span className="badge cancelled">Cancelled</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString();
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
    <div className="leave-container">
      {/* Side Panel */}
      <div className="side-panel">
        <div className="company-logo">
          <h2>AttendancePro</h2>
        </div>
        <nav className="nav-menu">
          <ul>                     
            <li><a href="/home"> <FaHome className="icon" /> Home</a></li>
            <li className="active"><a href="/leave-request-form"> <FcLeave className="icon" /> Leave </a></li>
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
          <h1>Leave</h1>
          <div className="user-info">
            <span><strong>{employeeName}</strong></span>
          </div>
        </header>

        {/* Leave Days Card */}
        <LeaveDaysCard leaveBalances={leaveBalances} />

        {/* Leave Request Form */}
        <div className="leave-request-form">
          <h2>Request Leave</h2>
          {showSuccess && (
            <div className="alert success">
              Your leave request has been submitted successfully!
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={todayDate}
                  max={new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]}
                  className={errors.startDate ? 'error' : ''}
                />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={todayDate}
                  max={new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]}
                  className={errors.endDate ? 'error' : ''}
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leaveType">Leave Type</label>
                <select
                  id="leaveType"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className={errors.leaveType ? 'error' : ''}
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                {errors.leaveType && <span className="error-message">{errors.leaveType}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="leaveDuration">Duration</label>
                <select
                  id="leaveDuration"
                  name="leaveDuration"
                  value={formData.leaveDuration}
                  onChange={handleChange}
                  className={errors.leaveDuration ? 'error' : ''}
                >
                  <option value="">Select Leave Duration</option>
                  <option value="FULL_LEAVE">Full Day</option>
                  <option value="AM_LEAVE">Morning Half</option>
                  <option value="PM_LEAVE">Afternoon Half</option>
                </select>
                {errors.leaveDuration && <span className="error-message">{errors.leaveDuration}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                className={errors.reason ? 'error' : ''}
              ></textarea>
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* Leave History */}
        <div className="leave-history">
          <h2>Leave History</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Requested At</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approved At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((leave) => (
                  <tr key={leave.id}>
                    <td>{formatDateTime(leave.requestedAt)}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.leaveDuration}</td>
                    <td>{leave.reason}</td>
                    <td>{getStatusBadge(leave.status)}</td>
                    <td>{formatDateTime(leave.approvedAt)}</td>
                    <td>
                      {leave.status === 'PENDING' && (
                        <>
                          {showDeleteConfirm === leave.id ? (
                            <div className="delete-confirm">
                              <button onClick={() => confirmDelete(leave.id)} className="confirm">Confirm</button>
                              <button onClick={cancelDelete} className="cancel">Cancel</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDelete(leave.id)} 
                              className="delete-btn"
                              title="Delete request"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </>
                      )}
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

export default LeaveRequestForm;