# HIS Quasar - Deployment Guide

We have restructured the project into two main components for easier deployment:

1.  **Backend & AI (Hugging Face Spaces)**: A unified container running Node.js Backend, Predictive ML, and OCR.
2.  **Frontend (Vercel)**: The React application.

---

## 1. Deploying Backend (Hugging Face Spaces)

This will host your API, Database connection, and all AI models in one place.

### Steps:
1.  Go to [huggingface.co/spaces](https://huggingface.co/spaces) and create a **New Space**.
    *   **Space Name**: e.g., `his-backend`
    *   **SDK**: Select **Docker** (Blank).
    *   **Visibility**: Public.

2.  **Upload the Code**:
    *   We will upload the contents of the `hf_deploy` folder.
    *   **Option A (Web Upload)**:
        *   Navigate to your Space's "Files" tab.
        *   Drag and drop the contents of the `hf_deploy` folder (Dockerfile, start.sh, backend folder, etc.).
        *   Commit changes.
    *   **Option B (Git)**:
        *   `cd hf_deploy`
        *   `git init`
        *   `git remote add space https://huggingface.co/spaces/YOUR_USERNAME/his-backend`
        *   `git add .`
        *   `git commit -m "Initial deploy"`
        *   `git push -f space main`

3.  **Environment Variables**:
    *   Go to your Space's **Settings**.
    *   Scroll to **Variables and secrets**.
    *   Add the following secrets (Secret Name -> Value):
        *   `MONGODB_URI` -> `mongodb+srv://shravanibaraskar_db_user:R12COy0mdrk1I1l4@cluster2.fs2fnzl.mongodb.net/?retryWrites=true&w=majority`
        *   `JWT_SECRET` -> `your_secure_jwt_secret_key_here`
    *   *Note: Ports 5002 and 8000 are handled internally, you don't need to expose them.*

4.  **Get your Backend URL**:
    *   Once the Space is "Running", click the "Embed this space" or look at the URL.
    *   It will look like: `https://yourusername-his-backend.hf.space`
    *   **Important**: Your API URL will be `https://yourusername-his-backend.hf.space/api/v1`

---

## 2. Deploying Frontend (Vercel)

1.  **Prepare Configuration**:
    *   Go to `hospital-his-frontend` folder.
    *   Open (or create) `.env.production`.
    *   Update the API URL to point to your new Hugging Face Space:
        ```
        VITE_API_URL=https://<YOUR-SPACE-URL>.hf.space/api/v1
        VITE_SOCKET_URL=https://<YOUR-SPACE-URL>.hf.space
        ```

2.  **Deploy**:
    *   Go to [vercel.com](https://vercel.com) -> **Add New Project**.
    *   Import your GitHub repository (you should push the whole project or just the frontend folder to GitHub first).
    *   **Root Directory**: Edit this to `hospital-his-frontend`.
    *   **Environment Variables**: Add the variables from `.env.production` here as well if needed.
    *   Click **Deploy**.

---

## Folder Structure Summary

*   `hf_deploy/` -> **Directly to Hugging Face**
    *   Contains Backend + Predictive ML + OCR.
    *   Controlled by `start.sh` and `Dockerfile`.
*   `hospital-his-frontend/` -> **Directly to Vercel**
    *   Contains the React User Interface.

