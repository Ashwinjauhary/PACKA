# PACKA Free Tier Deployment Guide 🚀

Your codebase is now fully configured for a 1-Click free-tier deployment across 4 distinct cloud platforms. Follow these steps sequentially to deploy your Microservices architecture.

---

## 1. Database Setup (Supabase / Neon)
We need a cloud PostgreSQL database to store users and compliance scan results.
1. Go to [Supabase](https://supabase.com) or [Neon.tech](https://neon.tech) and create a free project.
2. Open the **SQL Editor** in your new project.
3. Open `server/schema.sql` from your local codebase, copy its entire contents, and run it in the SQL Editor.
4. Go to **Settings > Database** and copy the **Connection String (URI)**.
   *(It will look like: `postgresql://postgres:password@db.supabase.co:5432/postgres`)*

---

## 2. ML Backend (HuggingFace Spaces)
Since the Python backend requires 1-2GB of RAM for YOLOv8 and Transformers NER, HuggingFace Spaces (which offers 16GB RAM for free) is the best choice.
1. Go to [HuggingFace Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space (e.g., `packa-ml-engine`).
3. Select **Gradio** as the Space SDK and choose **Blank** (This is entirely free!).
4. Keep Space hardware as **ZeroGPU Free** or **CPU Basic**.
5. In the Space files, upload the *entire contents* of your `ml-backend/` folder. The newly added `app.py` ensures the FastAPI server runs flawlessly inside the Gradio Space.
6. The space will automatically start building. Once running, click "App" to get your live URL.
   *(It will look like: `https://yourusername-packa-ml-engine.hf.space`)*

---

## 3. Node.js Backend (Render)
We will deploy the main Express server on Render using a manual Web Service (which is completely free).
1. Go to [Render](https://render.com) and link your GitHub account.
2. Go to your dashboard and click **New > Web Service** (Do NOT use Blueprint).
3. Connect your GitHub repository containing this codebase.
4. Fill in the following details:
   - Name: `packa-backend` (or anything)
   - Runtime: `Node`
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Instance Type: **Free**
5. Scroll down to **Environment Variables** and click "Add Environment Variable". Add these 3:
   - `DATABASE_URL`: Paste the URI you copied from Supabase (Step 1).
   - `JWT_SECRET`: Type any random secure string (e.g., `sih_super_secret_2026`).
   - `ML_BACKEND_URL`: Paste the live URL of your HuggingFace Space (Step 2).
6. Click **Create Web Service**. Once finished, copy the backend live URL.
   *(It will look like: `https://packa-backend.onrender.com`)*

---

## 4. React Frontend (Vercel)
Finally, we deploy the UI on Vercel. Vercel will automatically read the `vercel.json` file for routing.
1. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Keep the Framework Preset as **Vite** (Vercel detects this automatically).
4. Open the **Environment Variables** section and add:
   - Name: `VITE_API_URL`
   - Value: Paste your Render URL from Step 3 (Make sure to append `/api`, e.g., `https://packa-backend.onrender.com/api`)
5. Click **Deploy**.

🎉 **Congratulations!** Your complex microservice architecture is now live globally on free tiers.
