// controller/advisorController.js

exports.linkUserToAdvisor = async (req, res) => {
  const { advisorId, userId } = req.body;
  await db.query(`INSERT INTO advisor_user_links (advisor_id, user_id) VALUES (?, ?)`, [advisorId, userId]);
  res.json({ success: true });
};

exports.placeTradeForUser = async (req, res) => {
  const { advisorId, userId, asset, direction, leverage, amount, open_price } = req.body;
  await db.query(`
    INSERT INTO advisor_trades (advisor_id, user_id, asset, direction, leverage, amount, open_price, opened_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [advisorId, userId, asset, direction, leverage, amount, open_price]);
  res.json({ success: true });
};

exports.closeTradeAndCalculateCommission = async (req, res) => {
  const { tradeId, close_price } = req.body;
  const [trade] = await db.query(`SELECT * FROM advisor_trades WHERE id = ?`, [tradeId]);

  const profit = (close_price - trade.open_price) * (trade.direction === 'LONG' ? 1 : -1) * trade.amount;

  await db.query(`
    UPDATE advisor_trades SET close_price = ?, profit = ?, closed_at = NOW(), status = 'CLOSED' WHERE id = ?
  `, [close_price, profit, tradeId]);

  const commission = (profit > 0) ? profit * 0.30 : 0;

  await db.query(`
    INSERT INTO advisor_commissions (advisor_trade_id, advisor_id, user_id, commission_amount, calculated_at)
    VALUES (?, ?, ?, ?, NOW())
  `, [tradeId, trade.advisor_id, trade.user_id, commission]);

  res.json({ success: true, commission });
};
