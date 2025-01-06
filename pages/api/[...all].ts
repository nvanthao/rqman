import { Buffer } from "buffer";
import { IncomingMessage } from "http";
import httpProxy from "http-proxy";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    // Enable `externalResolver` option in Next.js
    externalResolver: true,
    bodyParser: false,
  },
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const rqliteHost = process.env.RQLITE_HOST || "http://localhost:4001";
  const rqliteUsername = process.env.RQLITE_USERNAME || "kotsadm";
  const rqlitePassword = process.env.RQLITE_PASSWORD;

  return new Promise((resolve, reject) => {
    const proxy: httpProxy = httpProxy.createProxy();

    proxy
      .once("proxyReq", (proxyReq, req, res, options) => {
        
        // use environment variables first
        if (rqliteUsername && rqlitePassword) {
          const authHeader = Buffer.from(`${rqliteUsername}:${rqlitePassword}`).toString("base64");
          proxyReq.setHeader("Authorization", `Basic ${authHeader}`);
        } else {
          // fallback to client-provided header
          proxyReq.setHeader("Authorization", String(req.headers["x-rqlite-authorization"]));
        }

        if(proxyReq.path && req.url) {
          proxyReq.path = req.url.replace("/api/rqlite", "");
        }
      })
      .once("proxyRes", resolve)
      .once("error", reject)
      .web(req, res, {
        changeOrigin: true,
        target: rqliteHost,
      });
  });
}