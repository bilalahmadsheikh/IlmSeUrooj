# Push to GitHub - Step by Step

## IMPORTANT: Your token was exposed in a screenshot! Revoke it now.
Go to **https://github.com/settings/tokens** and delete the old token, then create a new one.

---

## Step 1: Create a NEW Personal Access Token

1. Open: **https://github.com/settings/tokens**
2. Delete any old token (it was exposed!)
3. Click **"Generate new token"** → **"Generate new token (classic)"**
4. Name it: `push`
5. Check **`repo`**
6. Generate and **copy** the new token

---

## Step 2: Push - Copy & Paste These Exact Commands

**The folder name is `IlmSeUrooj` (capital I, S, U) - NOT "ilmseurooj"**  
**The branch is `bilal` - NOT "main"**

```powershell
cd "c:\Users\a\ilmseurooj_web\IlmSeUrooj"
git push origin bilal
```

When prompted:
- **Username:** `bushrahhh`
- **Password:** Your NEW token (not your GitHub password)

---

## Alternative: Token in URL (if popup fails)

```powershell
cd "c:\Users\a\ilmseurooj_web\IlmSeUrooj"
git push https://bushrahhh:PASTE_NEW_TOKEN_HERE@github.com/bilalahmadsheikh/IlmSeUrooj.git bilal
```

Replace `PASTE_NEW_TOKEN_HERE` with your new token.
