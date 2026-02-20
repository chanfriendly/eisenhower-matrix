# Publishing the Eisenhower Matrix App

Currently, your Eisenhower Matrix application is in **"Testing"** mode in the Google Cloud Console. This means only you (and any specific email addresses you manually added as "Test Users") can log in.

If you want *anyone* with a Google account to be able to log in and use your hosted version of the app, you need to transition your Google Cloud project from "Testing" to "In Production".

Here is a step-by-step guide on how to do that, along with important security and cost considerations.

---

## 🚀 Step-by-Step Guide to Publishing

1. **Go to the Google Cloud Console**
   - Navigate to [console.cloud.google.com](https://console.cloud.google.com/).
   - Ensure you have selected the project you created for this Eisenhower Matrix app (look at the dropdown in the top blue bar).

2. **Navigate to the OAuth Consent Screen**
   - In the left-hand menu, go to **APIs & Services** > **OAuth consent screen**.

3. **Provide App Information**
   - If you haven't already, you must fill out the required fields:
     - **App name:** The name users will see when they log in (e.g., "Eisenhower Matrix Planner").
     - **User support email:** An email address users can contact if they have issues.
     - **Developer contact information:** Your email address (required by Google).

4. **Set the Publishing Status to "Production"**
   - On that same "OAuth consent screen" page, look for the **Publishing status** section.
   - Click the button that says **"Publish App"**.
   - A confirmation dialog will appear. Confirm that you want to move to Production.

5. **(Optional but Recommended) App Verification**
   - Because this app requests access to the Google Tasks API (`https://www.googleapis.com/auth/tasks`), which is considered a **Sensitive Scope**, Google may require you to go through an "App Verification" process to remove the scary "Unverified App" warning that users will see when logging in.
   - To verify:
     - You will need to provide a link to your app's **Privacy Policy** and **Terms of Service** (you can host simple text documents on your Vercel site for this).
     - You will need to verify ownership of the domain where your app is hosted (e.g., your Vercel URL).
     - Submit the verification request. Google usually takes 3-5 days to manually review and approve it.
   - *Note: If you don't verify, users can still use the app, but they will have to click through an intimidating "Google hasn't verified this app" warning screen by clicking "Advanced" -> "Go to Eisenhower Matrix (unsafe)".*

---

## 🔒 Security Implications

By making the app public, you are opening it up to any user on the internet. However, due to the architecture of the app, the security risks are heavily mitigated:

- **Client-Side Only:** This app runs entirely in the user's browser. It talks *directly* to Google APIs. We do not have a backend database, and we do not store or intercept user data.
- **Isolated User Data:** When a user logs in, they get an Access Token that lives temporarily in *their* browser. They are only interacting with *their own* Google Tasks account. They cannot see your tasks, and you cannot see theirs.
- **Your Client ID is Public:** Your `VITE_GOOGLE_CLIENT_ID` is embedded in the frontend code. **This is normal and safe for frontend applications.** The Client ID merely identifies *which app* is making the request; it is the *User's Access Token* (which we handle securely) that grants permission to read/write data.

**The main risk** is reputation: if someone creates a malicious clone site and uses your Client ID to trick users into logging in, the consent screen will say it's your app. To prevent this, ensure that in your Google Cloud Console (under APIs & Services > Credentials > OAuth 2.0 Client IDs), you have strictly restricted the **Authorized JavaScript origins** and **Authorized redirect URIs** to *only* be your exact Vercel production URL (e.g., `https://your-app.vercel.app`). Do not leave this blank or use wildcards.

---

## 💰 Cost Implications

- **Google Tasks API Costs:** The Google Tasks API is currently **free to use** and does not have a direct billing cost per request like some other Google Cloud APIs (such as Maps or Vertex AI).
- **Quotas:** There is a generous default quota (e.g., 50,000 requests per day per project). If your app becomes incredibly popular and thousands of people are using it every day, you might hit this free quota limit. If that happens, the app will temporarily stop working for users until the quota resets the next day, but you will **not** be automatically charged money.
- **Hosting Costs:** Vercel (or Netlify/GitHub Pages) provides generous free tiers for static frontend hosting. Unless you are receiving massive amounts of bandwidth traffic, hosting this app will remain free.

**Summary:** Publishing this app is safe and practically free. The biggest hurdle is the optional Google App Verification process if you want to remove the "Unverified App" warning for new users.
