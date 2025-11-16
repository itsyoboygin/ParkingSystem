import { useState, useEffect } from 'react';
import { getSupervisors, getAllShifts, getAllSupervisorReports } from '../api/client';
import Loading from '../components/Loading';
import { UserCheck, Clock, DollarSign } from 'lucide-react';

const SupervisorsPage = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supervisorsRes, shiftsRes, reportsRes] = await Promise.all([
        getSupervisors(),
        getAllShifts(),
        getAllSupervisorReports()
      ]);
      
      // API returns {data: {data: [...], count: N}}
      const supervisorsData = supervisorsRes.data?.data || [];
      const shiftsData = shiftsRes.data?.data || [];
      const reportsData = reportsRes.data?.data || [];
      
      setSupervisors(supervisorsData);
      setShifts(shiftsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching supervisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  /* Pagination Logic */
  const itemsPerPage = 20;
  const paginate = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const [currentPageSupervisors, setCurrentPageSupervisors] = useState(1);
  const [currentPageReports, setCurrentPageReports] = useState(1);
  const [currentPageShifts, setCurrentPageShifts] = useState(1); 
  
  const currentSupervisors = paginate(supervisors, currentPageSupervisors);
  const currentReports = paginate(reports, currentPageReports);
  const currentShifts = paginate(shifts, currentPageShifts);

  
  const totalPagesSupervisors = Math.ceil(supervisors.length / itemsPerPage);
  const totalPagesReports = Math.ceil(reports.length / itemsPerPage);
  const totalPagesShifts = Math.ceil(shifts.length / itemsPerPage);

  
  const renderPagination = (currentPage, setCurrentPage, totalPages) => (
    <div className="table-pagination">
      <div className="page-controls">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
  
  if (loading) return <Loading />;

  return (
    <div className="dashboard-container">
      <div className="page-header mb-6">
        <h1>Supervisor Management</h1>
        <p>Monitor shift schedules and fee collection tracking</p>
      </div>

      {/* Supervisors Overview */}
      <div className="stat-cards-grid">
        <div className="stat-card-item">
          <div className="stat-card-content">
            <p className="stat-card-label">Total Supervisors</p>
            <p className="stat-card-value">{supervisors.length}</p>
          </div>
          <div className="stat-card-icon">
            <UserCheck className="w-8 h-8" />
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-card-content">
            <p className="stat-card-label">Active Shifts Today</p>
            <p className="stat-card-value">
              {shifts.filter(s => !s.check_out_time && s.check_in_time && new Date(s.check_in_time).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="stat-card-icon">
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <div className="stat-card-item">
          <div className="stat-card-content">
            <p className="stat-card-label">Total Collection (Month)</p>
            <p className="stat-card-value">
              {reports.reduce((sum, r) => sum + (r.total_money_made || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="stat-card-icon">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Supervisors List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-primary mb-4">All Supervisors</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-lg">ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header rounded-tr-lg">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {supervisors.map((supervisor, idx) => (
                <tr key={`supervisor-${supervisor.supervisor_id || 'unknown'}-${idx}`} className="hover:bg-gray-50">
                  <td className="table-cell">{supervisor.supervisor_id}</td>
                  <td className="table-cell font-medium">{supervisor.name || 'N/A'}</td>
                  <td className="table-cell">{supervisor.phone_number || 'N/A'}</td>
                  <td className="table-cell">{supervisor.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination(currentPageSupervisors, setCurrentPageSupervisors, totalPagesSupervisors)}
      </div>

      {/* Monthly Financial Report */}
      {reports.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">Monthly Financial Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg">Supervisor</th>
                  <th className="table-header">Total Shifts</th>
                  <th className="table-header">Money Collected</th>
                  <th className="table-header">Salary</th>
                  <th className="table-header rounded-tr-lg">Report Month</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {reports.map((report, idx) => (
                  <tr key={`report-${report.supervisor_report_id || 'unknown'}-${idx}`} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{report.supervisor_name || 'N/A'}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {report.total_shifts_made || 0} shifts
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-green-600">
                      {(report.total_money_made || 0).toLocaleString()} VND
                    </td>
                    <td className="table-cell">
                      {(report.salary || 0).toLocaleString()} VND
                    </td>
                    <td className="table-cell">
                      {report.month ? new Date(report.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {renderPagination(currentPageReports, setCurrentPageReports, totalPagesReports)}
        </div>
      )}
      <br></br>
      {/* Recent Shifts */}
      <div className="card">
        <h2 className="text-xl font-semibold text-primary mb-4">Recent Shifts</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-lg">Shift ID</th>
                <th className="table-header">Supervisor</th>
                <th className="table-header">Day</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header rounded-tr-lg">Money Collected</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentShifts.map((shift, idx) => (
                <tr key={`shift-${shift.shift_id || 'unknown'}-${idx}`} className="hover:bg-gray-50">
                  <td className="table-cell">{shift.shift_id}</td>
                  <td className="table-cell font-medium">{shift.supervisor_name || 'N/A'}</td>
                  <td className="table-cell">{shift.day?.trim() || 'N/A'}</td>
                  <td className="table-cell">
                    {shift.check_in_time ? new Date(shift.check_in_time).toLocaleString() : 'N/A'}
                  </td>
                  <td className="table-cell">
                    {shift.check_out_time ? 
                      new Date(shift.check_out_time).toLocaleString() : 
                      <span className="text-green-600 font-semibold">Active</span>
                    }
                  </td>
                  <td className="table-cell font-semibold text-green-600">
                    {(shift.total_money_collected || 0).toLocaleString()} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {renderPagination(currentPageShifts, setCurrentPageShifts, totalPagesShifts)}
      </div>
    </div>
  );
};

export default SupervisorsPage;