import React, { useEffect, useState } from 'react';
import { fetchCommissions } from '../../services/advisorAPI';

const CommissionStats = ({ advisorId }) => {
  const [commissions, setCommissions] = useState([]);

  useEffect(() => {
    const loadCommissions = async () => {
      try {
        const res = await fetchCommissions(advisorId);
        setCommissions(res.data);
      } catch (err) {
        console.error('Error loading commissions', err);
      }
    };
    loadCommissions();
  }, [advisorId]);

  const total = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0).toFixed(4);
  const avg = commissions.length > 0
    ? (total / commissions.length).toFixed(4)
    : '0.0000';

  return (
    <div className="bg-white shadow-md p-4 rounded-xl border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Commission Summary</h2>
      <div className="text-sm mb-4">
        <p><strong>Total Earned:</strong> {total}</p>
        <p><strong>Average per Trade:</strong> {avg}</p>
        <p><strong>Trades Count:</strong> {commissions.length}</p>
      </div>

      {commissions.length > 0 ? (
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Trade ID</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Commission</th>
              <th className="p-2 text-left">Earned At</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-2">#{c.advisor_trade_id}</td>
                <td className="p-2">{c.user_id}</td>
                <td className="p-2">{parseFloat(c.commission_amount).toFixed(4)}</td>
                <td className="p-2">{new Date(c.calculated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600 text-sm">No commissions recorded yet.</p>
      )}
    </div>
  );
};

export default CommissionStats;
