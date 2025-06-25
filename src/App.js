// App.js – Added log filtering and log export
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate
} from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const getTimestamp = () => new Date().toLocaleString();

const UserManagement = () => {
  const [users, setUsers] = useState(JSON.parse(localStorage.getItem('users')) || {});
  const [log, setLog] = useState(JSON.parse(localStorage.getItem('log')) || []);
  const [editing, setEditing] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const currentUser = localStorage.getItem('username');

  const saveLog = (entry) => {
    const newLog = [...log, { timestamp: getTimestamp(), user: currentUser, action: entry }];
    localStorage.setItem('log', JSON.stringify(newLog));
    setLog(newLog);
  };

  const handleDelete = (username) => {
    if (users[username].role === 'admin') {
      alert('Cannot delete another admin.');
      return;
    }
    if (window.confirm(\`Are you sure you want to delete user '\${username}'?\`)) {
      const updatedUsers = { ...users };
      delete updatedUsers[username];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      saveLog(\`Deleted user '\${username}'\`);
    }
  };

  const startEdit = (username, role) => {
    setEditing(username);
    setNewRole(role);
  };

  const saveEdit = () => {
    const updatedUsers = { ...users, [editing]: { ...users[editing], role: newRole, modified: getTimestamp() } };
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    saveLog(\`Changed role of '\${editing}' to '\${newRole}'\`);
    setEditing(null);
  };

  const filteredUsers = Object.entries(users).filter(([name, info]) =>
    name.toLowerCase().includes(search.toLowerCase()) ||
    info.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLog = log.filter(entry =>
    entry.user.toLowerCase().includes(logSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Username', 'Role', 'Modified'];
    const rows = filteredUsers.map(([name, info]) => [name, info.role, info.modified || 'N/A']);
    let csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'user_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('User List', 14, 16);
    const rows = filteredUsers.map(([name, info]) => [name, info.role, info.modified || 'N/A']);
    doc.autoTable({ head: [['Username', 'Role', 'Modified']], body: rows, startY: 20 });
    doc.save('user_list.pdf');
  };

  const exportLogToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action'];
    const rows = filteredLog.map(({ timestamp, user, action }) => [timestamp, user, action]);
    let csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'activity_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2>User Management</h2>
      <input
        type="text"
        placeholder="Search by username or role"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 10, padding: 8, width: '100%' }}
      />
      <button onClick={exportToCSV} style={{ marginRight: 10 }}>Export CSV</button>
      <button onClick={exportToPDF}>Export PDF</button>
      <table border="1" cellPadding="8" style={{ marginTop: 10 }}>
        <thead>
          <tr><th>Username</th><th>Role</th><th>Modified</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filteredUsers.map(([name, info]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>
                {editing === name ? (
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="doctor">Doctor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  info.role
                )}
              </td>
              <td>{info.modified || 'N/A'}</td>
              <td>
                {editing === name ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(name, info.role)}>Edit</button>
                    {name !== currentUser && (
                      <button onClick={() => handleDelete(name)}>Delete</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Activity Log</h3>
      <input
        type="text"
        placeholder="Search activity log"
        value={logSearch}
        onChange={(e) => setLogSearch(e.target.value)}
        style={{ margin: '10px 0', padding: 8, width: '100%' }}
      />
      <button onClick={exportLogToCSV} style={{ marginBottom: 10 }}>Export Log CSV</button>
      <ul>
        {filteredLog.map((entry, idx) => (
          <li key={idx}>{entry.timestamp} - {entry.user}: {entry.action}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
