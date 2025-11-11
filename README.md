# 🔑 KeySec Hunter

**Keywords + Secrets = KeySec Hunter**

KeySec Hunter is a **Chrome extension** that scans webpages and linked JavaScript files for **user-defined keywords** and **potential secrets** (API keys, tokens, passwords, credentials, etc.).  
It’s built for security researchers, developers, and bug bounty hunters who want to quickly detect sensitive data leaks during web analysis.

## 🚀 Features
- **Custom Keyword Scanning** — define your own keywords to match anything you care about.
- **Secret Detection Engine** — built-in regex patterns for API keys, tokens, and credentials.
- **Smart Crawling** — scans internal links and JavaScript files.
- **Three Notification Modes**
  - Chrome notifications  
  - In-page alerts  
  - Disabled mode for silent operation
- **Simple UI Tabs**
  - Home — live scan results for keywords and secrets  
  - All Parameter Links — lists every link with parameters found on the site  
  - Settings — configure keywords, limits, and notifications easily

## ⚙️ How to Use
1. **Clone or download** this repository.
2. Open Chrome → go to chrome://extensions/
3. Enable Developer mode
4. Click Load unpacked and select the KeySec Hunter folder
5. Visit any website and open the KeySec Hunter popup
6. Toggle scanning ON and watch results update live!

## 🏠 Home Tab
Shows **Keywords found** and **Secrets detected** in real-time while scanning a page.
<img width="898" height="624" alt="image" src="https://github.com/user-attachments/assets/e3e0c3de-4a7b-4a49-bc7a-fe039bb74a63" />
## 🔗 All Parameter Links Tab
Displays **all URLs that contain query parameters**, helping you discover interesting endpoints for further testing.
<img width="892" height="693" alt="image" src="https://github.com/user-attachments/assets/817d6934-5c8f-453b-b3fc-6db20bb0be47" />
## ⚙️ Settings Tab
Customize your scan by adding **keywords** you want to search across the website, choose **max links**, and set your **notification mode**.
<img width="892" height="693" alt="KeySec Hunter Settings tab" src="https://github.com/user-attachments/assets/817d6934-5c8f-453b-b3fc-6db20bb0be47" />

## 📁 Project Structure
keysec-hunter/

├── manifest.json

├── background.js

├── popup.html

├── popup.js

├── styles.css

├── regax.txt          # secret regex list (You can add your favourite regax in this file)

└── icons/
