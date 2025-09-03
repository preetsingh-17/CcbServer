// src/pages/Gestora/Dashboard.js
import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './ReclutadorDashboard.css';

function ReclutadorDashboard() {
  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Power BI</h1>
      </div>
    </DashboardLayout>
  );
}

export default ReclutadorDashboard;