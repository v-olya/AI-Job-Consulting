import { google } from "googleapis";
import http from "node:http";
import open from "open";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://mail.google.com/"];

async function main() {
  // Step 1: Create the auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES
  });

  console.log("Opening browser for authorization…", authUrl);

  // Step 2: Start a local server to receive the redirect
  const server = http.createServer(async (req, res) => {
    if (!req.url) return;

    if (req.url.startsWith("/oauth2callback")) {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get("code");

      res.end("Authorization successful! You can close this window.");

      server.close();

      if (!code) {
        console.error("No code returned");
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);

        console.log("=== SUCCESS ===");
        console.log("Your refresh token:");
        console.log(tokens.refresh_token);
        console.log("Save this token in your environment variables.");

      } catch (err) {
        console.error("Error exchanging code for tokens:", err);
      }
    }
  });

  server.listen(3000, () => {
    open(authUrl);
  });
}

main().catch(console.error);