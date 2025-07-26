import React, { useState, useEffect } from 'react';
import { fetchLinkedUsers, placeTrade } from '../../services/advisorAPI';

const TradeControls = ({ advisorId }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: '',
    asset: 'BTC',
    direction: 'LONG',
    leverage: 2,
    amount: '',
    open_price: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchLinkedUsers(advisorId);
        setUsers(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({ ...prev, userId: res.data[0].id }));
        }
      } catch (err) {
        console.error('Error loading users', err);
      }
    };
    loadUsers();
  }, [advisorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await placeTrade({ advisorId, ...form });
      alert('Trade submitted successfully!');
      setForm((prev) => ({ ...prev, amount: '', open_price: '' }));
    } catch (err) {
      console.error('Trade failed', err);
      alert('Failed to place trade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md p-4 rounded-xl border border-gray-200 mt-6">
      <h2 className="text-xl font-semibold mb-4">Place Trade for Linked User</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label>User</label>
          <select name="userId" value={form.userId} onChange={handleChange} className="w-full p-2 border rounded">
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Asset</label>
          <select name="asset" value={form.asset} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        <div>
          <label>Direction</label>
          <select name="direction" value={form.direction} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
        <div>
          <label>Leverage (x)</label>
          <input
            type="number"
            name="leverage"
            min="1"
            max="100"
            value={form.leverage}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            placeholder="0.001"
            value={form.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Open Price</label>
          <input
            type="number"
            name="open_price"
            placeholder="Enter market price"
            value={form.open_price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {submitting ? 'Submitting...' : 'Place Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeControls;
