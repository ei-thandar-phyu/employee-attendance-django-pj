import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = ({ refresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    fetchAttendanceData();
  }, [refresh]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/attendance-data', {
        credentials: 'include',
      });
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Failed to fetch attendance data', error);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
    const status = attendanceData[dateStr];
    let dayClassName = 'calendar-day';

    if (status === 'on_time') {
      dayClassName += ' on-time';
    } else if (status === 'absent') {
      dayClassName += ' absent';
    } else if (status === 'late') {
      dayClassName += ' late';
    } else if (status === 'leave') {
      dayClassName += ' leave';
    }

    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();
    if (isToday) {
      dayClassName += ' today';
    }

    calendarDays.push(
      <div key={day} className={dayClassName}>
        {day}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>{`${monthNames[month]} ${year}`}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className="calendar-days-of-week">
        {dayNames.map((day, index) => (
          <div key={index}>{day}</div>
        ))}
      </div>
      <div className="calendar-grid">{calendarDays}</div>
    </div>
  );
};

export default Calendar;