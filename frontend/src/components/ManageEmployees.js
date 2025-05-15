import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaUser, FaHome, FaChartBar } from 'react-icons/fa';
import { FcLeave } from 'react-icons/fc';
import { MdEditCalendar, MdLogout } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";
import './ManageEmployees.css';
import { getCookie } from './utils';
import { useNavigate } from 'react-router-dom';

const ManageEmployees = () => {

  const navigate = useNavigate();
  
  const roles = ['STAFF', 'MANAGER', 'ADMIN'];
  
  const [departments, setDepartments] = useState([ ]);
  const [employees, setEmployees] = useState([ ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
    phone: '',
    joinedAt: new Date().toISOString().split('T')[0],
    role: 'Staff',
    reportTo: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  const getAllEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/all-employees/', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.status === 403) {
        alert('Access denied. Please log in first.');
        return;
      }
      const data = await response.json();
      setEmployees(data.employees);
    } catch (err) {
      console.error('Error fetching employees:', err);

      alert('Failed to fetch employees.');
    }
  };

  const getAllDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/all-departments-names/', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.status === 403) {
        alert('Access denied. Please log in first.');
        return;
      }
      const data = await response.json();
      setDepartments(data.department_names);
    } catch (err) {
      console.error('Error fetching departments:', err);  
      alert('Failed to fetch departments.');
    }
  };

  useEffect(() => {
      getAllEmployees();
      getAllDepartments();
  }, []);

  console.log('Employees:', employees);
  console.log('Departments:', departments);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (formData.role !== 'ADMIN' && !formData.department) newErrors.department = 'Department is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (showAddModal && !formData.password) newErrors.password = 'Password is required';

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (formData.firstName && !/^[a-zA-Z]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters';
    }
    if (formData.lastName && !/^[a-zA-Z]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters';
    }
    if (formData.role !== 'ADMIN' && !formData.reportTo) {
      newErrors.reportTo = 'Report To is required for this role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddEmployee = async(e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:8000/api/add-employee/', {
          method: 'POST',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok){
          const errorData = await response.json();
          console.error('Error:', errorData);
          alert('Failed to add employee. Please check the form data.');
          return;
        }

        const data = await response.json();
        console.log(data.message);
        getAllEmployees();
        setShowAddModal(false);
        resetForm();
    } catch (error) {
      console.error(error);
      alert('Error adding employee.');
    }
  }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    console.log('Editing Employee:', formData);
    if (validateForm()) {
      try {
        const response = await fetch(`http://localhost:8000/api/edit-employee/${currentEmployee.id}/`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to edit employee.');

        const data = await response.json();
        console.log(data.message);
        getAllEmployees();
        setShowEditModal(false);
        resetForm();
      } catch (error) {
        console.error(error);
        alert('Error editing employee.');
      }
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    setShowDeleteConfirm(null);
    try {
      const response = await fetch(`http://localhost:8000/api/delete-employee/${employeeId}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });

      if (!response.ok) throw new Error('Failed to delete employee.');

      const data = await response.json();
      console.log(data.message);
      getAllEmployees();
    } catch (error) {
      console.error(error);
      alert('Error deleting employee.');
    }
  };


  const openEditModal = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      username: employee.username,
      email: employee.email,
      password: '', // Don't show password in edit
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      department: employee.department,
      phone: employee.phone,
      joinedAt: employee.joinedAt,
      role: employee.role,
      reportTo: employee.reportTo || '',
      isActive: employee.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      department: '',
      phone: '',
      joinedAt: new Date().toISOString().split('T')[0],
      role: '',
      reportTo: '',
      isActive: true
    });
    setErrors({});
  };

  const getManagerOptions = () => {
    console.log('managers:', employees.filter(emp => emp.role !== 'STAFF' && emp.isActive));
    return employees.filter(emp => emp.role !== 'STAFF' && emp.isActive);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
    <div className="employees-container">
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
                <li className="active"><a href="/all-employees"> <FaChartBar className="icon" /> Employees</a></li>
                
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
          <h1>Employees</h1>
          <button 
            className="add-employee-btn"
            onClick={() => setShowAddModal(true)}
          >
            <FaUserPlus /> Add Employee
          </button>
        </header>
        
        {/* Employees Table */}
        <div className="employees-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-name">
                      <div className="avatar">
                        <FaUser />
                      </div>
                      {employee.firstName} {employee.lastName}
                    </div>
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.department || '---'}</td>
                  <td>{employee.position}</td>
                  <td>
                    <span className={`status ${employee.isActive ? 'active' : 'inactive'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(employee)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => setShowDeleteConfirm(employee.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add New Employee</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username*</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label>Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Password*</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label>Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                  <label>Position*</label>
                   <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className={errors.position ? 'error' : ''}
                  />
                  {errors.position && <span className="error-message">{errors.position}</span>}
                </div>

                <div className="form-group">
                  <label>Department*</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={errors.department ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <span className="error-message">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                  
                </div>

                <div className="form-group">
                  <label>Joined Date</label>
                  <input
                    type="date"
                    name="joinedAt"
                    value={formData.joinedAt}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Role*</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={errors.role ? 'error' : ''}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role, index) => (
                      <option key={index} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <span className="error-message">{errors.role}</span>}
                </div>

                <div className="form-group">
                  <label>Reports To</label>
                  <select
                    name="reportTo"
                    value={formData.reportTo}
                    onChange={handleInputChange}
                    className={errors.reportTo ? 'error' : ''}
                  >
                    <option value="">Select Report To</option>
                    {getManagerOptions().map(manager => (
                      <option key={manager.username} value={manager.username}>
                        {manager.firstName} {manager.lastName} ({manager.position})
                      </option>
                    ))}
                  </select>
                  {errors.reportTo && <span className="error-message">{errors.reportTo}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active Employee
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleAddEmployee}>
                  Save Employee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Employee</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username*</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={errors.username ? 'error' : ''}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label>Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                  <label>Position*</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className={errors.position ? 'error' : ''}
                  />
                  {errors.position && <span className="error-message">{errors.position}</span>}
                </div>

                <div className="form-group">
                  <label>Department*</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={errors.department ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <span className="error-message">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Joined Date</label>
                  <input
                    type="date"
                    name="joinedAt"
                    value={formData.joinedAt}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Role*</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={errors.role ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
                    {roles.map((role, index) => (
                      <option key={index} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <span className="error-message">{errors.role}</span>}
                </div>

                <div className="form-group">
                  <label>Reports To</label>
                  <select
                    name="reportTo"
                    value={formData.reportTo}
                    onChange={handleInputChange}
                    className={errors.reportTo ? 'error' : ''}
                  >
                   <option value="">Select Report To</option>
                    {getManagerOptions().map(manager => (
                      <option key={manager.username} value={manager.username}>
                        {manager.firstName} {manager.lastName} ({manager.position})
                      </option>
                    ))}
                  </select>
                  {errors.reportTo && <span className="error-message">{errors.reportTo}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active Employee
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => { setShowEditModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleEditEmployee}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this employee? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </button>
                <button 
                  className="delete-confirm-btn" 
                  onClick={() => handleDeleteEmployee(showDeleteConfirm)}
                >
                  Delete Employee
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEmployees;