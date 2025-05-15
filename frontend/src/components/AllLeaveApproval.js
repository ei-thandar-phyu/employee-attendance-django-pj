import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaClock, FaUser, FaTrash, FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';
import './LeaveApproval.css';
import { getCookie } from './utils';

const LeaveApproval = () => {
  const [showApproveConfirm, setShowApproveConfirm] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(null);
  const [noRequests, setNoRequests] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const navigate = useNavigate();

  const fetchRequestedLeave = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/all-leave-approval/', {
            method: 'GET',
            credentials: 'include',
        });

        const data = await response.json();
        console.log('Leave requests:', data);
        setLeaveRequests(data.leave_requests);
        if (data.length === 0) {
            setNoRequests(true);
        }
    } catch (err) {
        console.error('Error fetching leave requests:', err);
        alert('Failed to fetch leave requests.');
    }
  };

  useEffect(() => {
    fetchRequestedLeave();
  }, []);


  // const handleApprove = (id) => {
  //   setShowApproveConfirm(id);
  // };

  // const confirmApprove = async(id) => {
  //   try {
  //      const response = await fetch(`http://localhost:8000/api/leave-approval/${id}/approve/`, {
  //         method: 'POST',
  //         credentials: 'include',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'X-CSRFToken': getCookie('csrftoken'),
  //         },
  //       });

  //     if (response.ok) {
  //       fetchRequestedLeave();
  //       setShowApproveConfirm(null);
  //       console.log('Leave request approved successfully');
  //     } else {
  //       const data = await response.json();
  //       alert(data.message)
  //       console.error('Failed to approve leave request:', data);
  //     }
  //   } catch (e) {
  //     alert(e.message)
  //     console.error('Error approval of leave request:', e);
  //   }
  // };

  //  const cancelApprove = () => {
  //   setShowApproveConfirm(null);
  // };

  // const handleReject = (id) => {
  //   setShowRejectConfirm(id);
  // };

  // const confirmReject = async(id) => {
  //   try {
  //      const response = await fetch(`http://localhost:8000/api/leave-approval/${id}/reject/`, {
  //         method: 'POST',
  //         credentials: 'include',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'X-CSRFToken': getCookie('csrftoken'),
  //         },
  //       });

  //     if (response.ok) {
  //       fetchRequestedLeave();
  //       setShowRejectConfirm(null);
  //       console.log('Leave request rejected successfully');
  //     } else {
  //       const data = await response.json();
  //       alert(data.message)
  //       console.error('Failed to reject leave request:', data);
  //     }
  //   } catch (e) {
  //     alert(e.message)
  //     console.error('Error rejecting leave request:', e);
  //   }
  // };

  // const cancelReject = () => {
  //   setShowRejectConfirm(null);
  // };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge approved"><FaCheck /> Approved</span>;
      case 'REJECTED':
        return <span className="badge rejected"><FaTimes /> Rejected</span>;
      case 'CANCELLED':
        return <span className="badge cancelled"><FaTrash />Cancelled</span>;
      default:
        return <span className="badge pending"><FaClock /> Pending</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="leave-approval-container">
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
                <li><a href={getAttendanceLink()}> <FaChartBar className="icon" /> Attendance</a></li>
                <li className="active"><a href={getLeaveLink()}><MdEditCalendar className="icon" /> Leave Approval</a></li>
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
          <h1>Leave Approval</h1>
        </header>

        {/* Leave Requests Table */}
        <div className="leave-requests-table">
          <div className="table-responsive">
            { noRequests ? (
              <div className="no-requests-alert">No leave requests found.</div>
            ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requested At</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reequested To</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="employee-info">
                        <div className="avatar">
                          <FaUser />
                        </div>
                        <div>
                          <div className="name">{request.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDateTime(request.requestedAt)}</td>
                    <td>{request.leaveType}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>{request.duration}</td>
                    <td className="reason">{request.reason}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      {request.status === 'PENDING' ? (
                        <div className="approval-info">
                          {request.requestedTo && (
                            <div>{request.requestedTo}</div>
                          )}
                        </div>
                      ) : (
                        <div className="approval-info">
                          {request.apprejBy && (
                            <div>{request.apprejBy}</div>
                          )}                         
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;