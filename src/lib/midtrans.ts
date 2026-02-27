import midtransClient from "midtrans-client";

const sk = process.env.MIDTRANS_SERVER_KEY || "";
const ck = process.env.MIDTRANS_CLIENT_KEY || "";
const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Gunakan Sandbox di development, Production di production
export const snap = new midtransClient.Snap({
  isProduction: isProd,
  serverKey: sk,
  clientKey: ck,
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: isProd,
  serverKey: sk,
  clientKey: ck,
});
