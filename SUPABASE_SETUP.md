# Supabase (Database) Zero-to-Hero Setup Guide 🐘

Yeh guide un team members ke liye hai jo pehli baar Supabase par account banakar PACKA ka database setup kar rahe hain. 

Supabase ek free, open-source Firebase alternative hai jo backend ke liye PostgreSQL database provide karta hai. Isme hum apna `users` aur `scans` (compliance reports) ka data store karenge.

---

## Step 1: Account Creation
1. Go to [https://supabase.com](https://supabase.com)
2. Top right corner mein **"Start your project"** par click karein.
3. Apna GitHub account ya Email use karke Sign Up karein.
4. Agar email verify karne ko bole, toh email check karke confirm kar dein.

---

## Step 2: Create a New Project
1. Login karne ke baad dashboard khulega. Wahan **"New Project"** button par click karein.
2. Agar usne Organization banane ko kaha, toh apne team ka naam daal dein (e.g., `PACKA-Team`).
3. Project Creation Form bharein:
   - **Name:** `packa-db` (ya jo bhi aap chahein).
   - **Database Password:** Ek bahot strong password banayein (iske bina database connect nahi hoga) aur ise **COPY karke kahin safe jagah (notepad me) rakh lein**. Supabase ye password wapas nahi dikhata.
   - **Region:** `South Asia (Mumbai)` ya jo bhi nearest region ho, select karein taaki speed fast rahe.
   - **Pricing Plan:** `Free tier` select rehne dein.
4. **"Create New Project"** par click karein.
5. *Note: Project setup hone mein 2-3 minute lag sakte hain.*

---

## Step 3: Run the Database Schema (SQL)
Ab humein apne tables (`users` aur `scans`) create karne hain. Humne already ek SQL file banayi hui hai jisme poora schema hai.
1. Jab project load ho jaye, toh left sidebar mein **"SQL Editor"** (</> icon) par click karein.
2. **"New Query"** par click karein.
3. Apne local codebase mein rakhi hui `server/schema.sql` file ko kholiye (vscode me) aur uska poora code (A to Z) copy kar lijiye.
4. Supabase ke SQL Editor ke blank page mein wo code paste kar dein.
5. Bottom right corner mein **"Run"** (ya Play) button par click karein.
6. Agar "Success" likha aa gaya, matlab aapke tables create ho gaye hain! (Aap left sidebar mein "Table Editor" icon par click karke check kar sakte hain ki `users` aur `scans` table wahan dikh rahe hain ya nahi).

---

## Step 4: Get the Connection String (URI)
Database ready hai, ab iska link humein apne Node.js server (Render) ko dena hai.
1. Left sidebar mein ekdum neeche **"Settings"** (gear icon ⚙️) par click karein.
2. Settings menu (left side) mein **"Database"** par click karein.
3. Thoda scroll down karein **"Connection string"** section tak.
4. Wahan **"URI"** tab par click karein.
5. Wahan aapko ek link dikhega jo kuch aisa hoga: 
   `postgresql://postgres.yourprojectref:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
6. Is link ko **Copy** kar lijiye.
7. Note: Link mein `[YOUR-PASSWORD]` likha hoga. Uski jagah aapko wo password type karna hai jo aapne Step 2.3 mein banaya tha. (Brackets `[]` hata kar).

**Final Step:** Yeh connection string jiske paas bhi Render (Node.js) account ka access hai, usko bhej dein taaki wo use `DATABASE_URL` ki tarah `.env` mein daal sake.

---
✅ **Done! Supabase Database fully operational and connected!**
