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
      setSupervisors(supervisorsRes.data.data);
      setShifts(shiftsRes.data.data);
      setReports(reportsRes.data.data);
    } catch (error) {
      console.error('Error fetching supervisor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Supervisor Management</h1>
        <p className="text-gray-600">Monitor shift schedules and fee collection tracking</p>
      </div>

      {/* Supervisors Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Supervisors</p>
              <p className="text-3xl font-bold text-primary">{supervisors.length}</p>
            </div>
            <div className="p-4 rounded-full bg-blue-100">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Shifts Today</p>
              <p className="text-3xl font-bold text-accent">
                {shifts.filter(s => !s.check_out_time && new Date(s.check_in_time).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="p-4 rounded-full bg-blue-100">
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Collection (Month)</p>
              <p className="text-3xl font-bold text-green-600">
                {reports.reduce((sum, r) => sum + (r.total_money_made || 0), 0).toLocaleString()} VND
              </p>
            </div>
            <div className="p-4 rounded-full bg-green-100">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
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
              {supervisors.map((supervisor) => (
                <tr key={supervisor.supervisor_id} className="hover:bg-gray-50">
                  <td className="table-cell">{supervisor.supervisor_id}</td>
                  <td className="table-cell font-medium">{supervisor.name}</td>
                  <td className="table-cell">{supervisor.phone_number}</td>
                  <td className="table-cell">{supervisor.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                {reports.map((report) => (
                  <tr key={report.supervisor_report_id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{report.supervisor_name}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {report.total_shifts_made} shifts
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-green-600">
                      {(report.total_money_made || 0).toLocaleString()} VND
                    </td>
                    <td className="table-cell">
                      {(report.salary || 0).toLocaleString()} VND
                    </td>
                    <td className="table-cell">{new Date(report.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              {shifts.slice(0, 20).map((shift) => (
                <tr key={shift.shift_id} className="hover:bg-gray-50">
                  <td className="table-cell">{shift.shift_id}</td>
                  <td className="table-cell font-medium">{shift.supervisor_name}</td>
                  <td className="table-cell">{shift.day?.trim()}</td>
                  <td className="table-cell">{new Date(shift.check_in_time).toLocaleString()}</td>
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
      </div>
    </div>
  );
};

export default SupervisorsPage;