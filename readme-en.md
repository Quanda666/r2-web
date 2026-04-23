![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

**[中文](./readme.md) | English**

# R2 Web

📁 A modern, elegant, full-stack Cloudflare R2 manager. Built on Cloudflare Pages + D1 Database, supporting multi-user accounts and multi-bucket management.

## Core Features

- **Multi-user System**: Supports registration/login, cloud config sync, and seamless switching across devices.
- **Multi-bucket Management**: Manage multiple R2 buckets with a quick switcher in the topbar.
- **Modern UI**: Exquisite Apple-style design with responsive layout and dark mode support.
- **Full-stack Architecture**: Uses Cloudflare Pages Functions for APIs and D1 database for persistent storage.
- **Zero-cost Deployment**: Fully utilizes Cloudflare's free tier, no server costs required.
- **Classic Features**: Drag-and-drop/paste upload, image compression, PWA support, file preview, and directory management are all preserved.

## Quick Deployment (CLI-free)

Deploy everything directly in your browser without installing Node.js or Wrangler.

### 1. Preparation
- A [Cloudflare](https://dash.cloudflare.com/) account.
- Fork this repository to your GitHub.

### 2. Create Pages Project
1. Log in to Cloudflare Dashboard, go to **Workers & Pages**.
2. Click **Create** -> **Pages** -> **Connect to Git**.
3. Select your forked `r2-web` repository.
4. **Build Settings**: 
   - Framework preset: `None`
   - Build command: (leave empty)
   - Output directory: `src`
5. Click **Save and Deploy**.

### 3. Create D1 Database
1. Go to **Storage & Databases** -> **D1** in the sidebar.
2. Click **Create**, name it `r2-web-db`.
3. Once created, go to the database, switch to the **Console** tab.
4. Copy the content of `schema.sql` from the repository root, paste it into the console, and click **Execute**.

### 4. Bind D1 to Pages
1. Go back to your Pages project -> **Settings** -> **Functions**.
2. Scroll to **D1 Database Bindings**, click **Add binding**.
3. Variable name: `DB`, Database: select the `r2-web-db` you just created.
4. **Important**: In **Environment Variables**, add `JWT_SECRET` with a random string as the encryption key.
5. Re-deploy the Pages project to apply changes.

### 5. Configure R2 Bucket CORS
Add CORS rules in your R2 bucket settings:
```json
[
  {
    "AllowedOrigins": ["https://your-project.pages.dev"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

## Feature Overview

| Category         | Specific Features                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| **Accounts**     | Registration/Login, Cloud Storage, Multi-bucket Sync, Guest Mode (Local Storage)                       |
| **Bucket Mgmt**  | Multi-bucket list, Topbar Switcher, Set as Default, Online Bucket Editing                              |
| **File Mgmt**    | Directory browsing, Pagination, Lazy loading; Rename, Move, Copy, Delete (Recursive); Batch operations |
| **Upload**       | Drag-and-drop/Paste/File Picker; Filename Templates; WebAssembly Local Image Compression              |
| **Preview**      | Image preview; Video/Audio player; Code highlighting                                                  |
| **Personalization** | Multi-language (ZH/TW/EN/JA); Dark mode; Density adjustment                                          |

## Feedback

- [GitHub Issues](https://github.com/vikiboss/r2-web/issues)
- [QQ Group](https://qm.qq.com/q/e47kAlbdsc) - 1091212613

## License

MIT License
