# 🚀 Fast Track Deployment Plan

Follow these exact steps to deploy your HIS system.

## Phase 1: Backend (Hugging Face Spaces)

**Goal:** Get the API and ML models running online.

1.  **Create Space**:
    *   Go to: https://huggingface.co/new-space
    *   **Name**: `his-backend` (or similar)
    *   **License**: `mit` (optional)
    *   **SDK**: Select **Docker** > **Blank**
    *   **Visibility**: **Public**
    *   Click **Create Space**.

2.  **Push Code**:
    *   Open your terminal in VS Code.
    *   Run these commands (replace `<YOUR_USERNAME>` with your HF username):
    ```bash
    cd hf_deploy
    git init
    # You might need to install git-lfs if you have large files, but usually standard git is fine for code
    git remote add space https://huggingface.co/spaces/<YOUR_USERNAME>/his-backend
    git add .
    git commit -m "Deploy v1"
    git push --force space main
    ```
    *(If it asks for a password, use your Hugging Face Access Token from Settings > Access Tokens)*

3.  **Configure Secrets**:
    *   On your Space page, go to **Settings** > **Variables and secrets**.
    *   Add a **New Secret**:
        *   `MONGODB_URI` = `mongodb+srv://shravanibaraskar_db_user:R12COy0mdrk1I1l4@cluster2.fs2fnzl.mongodb.net/?retryWrites=true&w=majority`
        *   `JWT_SECRET` = `your_secure_jwt_secret_key_here`
        *   `NODE_ENV` = `production`

4.  **Wait & Copy URL**:
    *   Wait for the "Building" status to turn **Running** (green).
    *   Click the **Embed this space** button (or looking at the top right context menu) to get the direct URL.
    *   It will look like: `https://<username>-his-backend.hf.space`
    *   **Copy this URL.**

---

## Phase 2: Frontend (Vercel)

**Goal:** Get the React UI running and talking to the backend.

1.  **Update Environment**:
    *   In VS Code, open `hospital-his-frontend/.env.production`.
    *   Paste your Backend URL:
    ```ini
    VITE_API_URL=https://<username>-his-backend.hf.space/api/v1
    VITE_SOCKET_URL=https://<username>-his-backend.hf.space
    VITE_OCR_URL=https://<username>-his-backend.hf.space
    ```
    *   Save the file.

2.  **Deploy**:
    *   Open terminal:
    ```bash
    cd ../hospital-his-frontend
    npx vercel deploy --prod
    ```
    *   **Login**: It might ask you to log in (follow browser prompt).
    *   **Setup**:
        *   "Set up and deploy?" -> **Y**
        *   "Which scope?" -> **(Select your account)**
        *   "Link to existing project?" -> **N**
        *   "Project name?" -> `hospital-his-frontend`
        *   "Directory?" -> `./`
        *   "Build Command?" -> (Default `npm run build`) -> **Enter**
        *   "Output Directory?" -> (Default `dist`) -> **Enter**
    
3.  **Done!**:
    *   Vercel will give you a production URL (e.g., `https://hospital-his-frontend.vercel.app`).
    *   Open it and test the Login!

---

## 🚑 Troubleshooting

*   **Backend "Build Failed"**: Check the "Logs" tab in Hugging Face. Usually it's a missing dependency in `requirements.txt`.
*   **"Network Error" on Frontend**: Ensure your `VITE_API_URL` has `/api/v1` at the end and uses `https`.
*   **CORS Issues**: Your Backend `config.js` allows all origins (`*`) by default in the new setup, so this should not happen.
