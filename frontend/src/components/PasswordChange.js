import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import './PasswordChange.css';
import { getCookie } from './utils';

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const employeeName = localStorage.getItem('employeeName');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
        setIsSubmitting(true);

        const newpw = {
            current_password: formData.currentPassword,
            new_password: formData.newPassword,
        };

          try {
            const response = await fetch('http://localhost:8000/api/change-password/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(newpw),
            });

            const text = await response.text(); // First read response as text
            let data;
            try {
                data = JSON.parse(text); // Try to parse JSON manually
            } catch (parseErr) {
                console.error('Non-JSON response:', text);
                throw new Error('Server returned invalid JSON');
            }

            if (!response.ok) {
                alert(data.message || 'Failed to change password.');
            } else {
                setShowSuccess(true);
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setTimeout(() => setShowSuccess(false), 5000);
            }
        } catch (error) {
            alert(error.message);
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }
  };


  const passwordRequirements = [
    { text: 'At least 8 characters', valid: formData.newPassword?.length >= 8 },
    { text: 'At least one uppercase letter', valid: /[A-Z]/.test(formData.newPassword) },
    { text: 'At least one number', valid: /[0-9]/.test(formData.newPassword) },
    { text: 'At least one special character', valid: /[!@#$%^&*]/.test(formData.newPassword) }
  ];

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
    <div className="password-change-container">
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
            <li className="active"><a href="/change-password"> <TbLockPassword className="icon" /> Change Password </a></li>
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
          <h1>Change Password</h1>
          <div className="user-info">
            <span><strong>{employeeName}</strong></span>
          </div>
        </header>

        {/* Password Change Form */}
        <div className="password-form-container">
          {showSuccess && (
            <div className="alert alert-success">
              Your password has been changed successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={errors.currentPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={errors.newPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}

              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className={req.valid ? 'valid' : ''}>
                      {req.valid ? <FaCheck className="icon" /> : <FaTimes className="icon" />}
                      {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;