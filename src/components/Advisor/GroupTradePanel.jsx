import React, { useEffect, useState } from 'react';
import { fetchLinkedUsers, placeTrade } from '../../services/advisorAPI';

const GroupTradePanel = ({ advisorId }) => {
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [tradeData, setTradeData] = useState({
    asset: 'BTC',
    direction: 'LONG',
    leverage: 2,
    percent: 10,
    open_price: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchLinkedUsers(advisorId);
        setLinkedUsers(res.data);
      } catch (err) {
        console.error('Error fetching users for group trade', err);
      }
    };
    loadUsers();
  }, [advisorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTradeData((prev) => ({ ...prev, [name]: value }));
  };

  const executeGroupTrade = async () => {
    if (!tradeData.open_price) return alert('Enter open price.');
    if (linkedUsers.length === 0) return alert('No linked users found.');

    setLoading(true);
    let success = 0;

    for (const user of linkedUsers) {
      try {
        const fakeBalance = 1000; // Replace with live balance fetch
        const tradeAmount = ((tradeData.percent / 100) * fakeBalance).toFixed(4);

        await placeTrade({
          advisorId,
          userId: user.id,
          asset: tradeData.asset,
          direction: tradeData.direction,
          leverage: tradeData.leverage,
          amount: tradeAmount,
          open_price: tradeData.open_price
        });

        success++;
      } catch (err) {
        console.error(`Trade failed for user ${user.id}`, err);
      }
    }

    setLoading(false);
    alert(`Group trade executed for ${success} users.`);
  };

  return (
    <div className="bg-white shadow-md p-4 rounded-xl border border-gray-200 mt-6">
      <h2 className="text-xl font-semibold mb-4">Group Trade Panel</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label>Asset</label>
          <select name="asset" value={tradeData.asset} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        <div>
          <label>Direction</label>
          <select
            name="direction"
            value={tradeData.direction}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
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
            value={tradeData.leverage}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>% of Balance</label>
          <input
            type="number"
            name="percent"
            min="1"
            max="100"
            value={tradeData.percent}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Open Price</label>
          <input
            type="number"
            name="open_price"
            value={tradeData.open_price}
            onChange={handleChange}
            placeholder="e.g., 62000"
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={executeGroupTrade}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {loading ? 'Processing...' : 'Execute Group Trade'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupTradePanel;
