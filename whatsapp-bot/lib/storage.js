const { randomUUID } = require("crypto");
const { kvGet, kvSet, kvDel } = require("./kv");

const PRODUCTS_KEY = "shopbot:products";
const ORDERS_KEY = "shopbot:orders";

async function getProducts() {
  return (await kvGet(PRODUCTS_KEY)) || [];
}
async function getActiveProducts() {
  return (await getProducts()).filter((p) => p.active);
}
async function getProduct(id) {
  return (await getProducts()).find((p) => p.id === id) ?? null;
}
async function addOrder(order) {
  const orders = (await kvGet(ORDERS_KEY)) || [];
  const full = { ...order, id: randomUUID(), createdAt: new Date().toISOString() };
  await kvSet(ORDERS_KEY, [...orders, full]);
  return full;
}

// Same key scheme as the Telegram bot's WhatsApp session helpers
// (lib/shopBot/storage.ts) so both channels are consistent.
async function getWaSession(phone) {
  return (await kvGet(`shopbot:wa:${phone}`)) || {};
}
async function setWaSession(phone, session, ex) {
  await kvSet(`shopbot:wa:${phone}`, session, ex);
}
async function clearWaSession(phone) {
  await kvDel(`shopbot:wa:${phone}`);
}

module.exports = { getActiveProducts, getProduct, addOrder, getWaSession, setWaSession, clearWaSession };
