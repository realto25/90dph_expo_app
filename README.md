Here is the full README in **Markdown format** for your `90dph_expo_app`. You can copy and paste this directly into a `README.md` file at the root of your project:

````markdown
# 🏠 90 Degree Pride Homes – Expo App (`90dph_expo_app`)

A modern, cross-platform real estate mobile app built with **Expo + React Native + TypeScript**, powering the digital presence of **90 Degree Pride Homes**. From QR-based visit bookings to agent-assigned plot management, this app bridges Guests, Clients, and Managers into a seamless ecosystem.

---

## 🔧 Tech Stack

- **Frontend:** Expo (React Native + TypeScript)
- **UI:** Shadcn-UI, NativeWind, React Native Paper
- **Navigation:** Expo Router
- **Backend CMS:** Strapi (with QR Plugin Integration)
- **Database:** Neon DB (PostgreSQL)
- **State & Services:** Custom API Layer, Global Store
- **Animations:** Lottie

---

## 📂 Folder Structure

```shell
90dph_expo_app/
├── app/                  # All routes & screen layouts (auth, guest, client, manager)
├── components/           # Reusable UI components (buttons, inputs, cards, etc.)
├── assets/               # Fonts, icons, splash screens, animations
├── services/             # API & business logic
├── store/                # App-level state management (e.g. auth, user role)
├── constants/            # App-wide constants
├── utils/                # Utility functions (e.g. haptics)
├── types/                # Global TypeScript definitions
├── .expo/                # Expo-related metadata
├── .env / .env.local     # Environment variables
├── app.json              # Expo configuration
├── tailwind.config.js    # Tailwind + NativeWind setup
├── metro.config.js       # Metro bundler config
├── tsconfig.json         # TypeScript config
````

---

## 🔐 User Roles & Flows

### 🧑‍💼 Guest Flow

* Phone OTP Login
* Browse Projects
* View Plot Details
* Book a Visit
* Await QR Approval
* Scan QR on Visit Day
* Submit Feedback (15 Days Later)

### 👨‍💻 Client Flow

* View Plot & Booking Status
* Submit Buy Request
* Request to Sell (with document upload, price, urgency, etc.)

### 🧑‍🏫 Manager Flow

* Assign Bookings
* Mark Attendance
* Leave Requests
* Admin Controls

---

## 🎯 Features

* 📸 **QR Code Integration**: Seamless check-ins at project sites
* 🌍 **Explore Projects**: Filter, sort, infinite scroll with detail views
* 📆 **Visit Booking Engine**: Controlled by QR-based access
* 📤 **Plot Requests**: Request to buy/sell with document uploads
* 📲 **Deep Navigation**: Role-based tab layouts via Expo Router
* ⚙️ **Admin Role Controls** (via Strapi Dashboard)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/90dph_expo_app.git
cd 90dph_expo_app
```

### 2. Install dependencies

```bash
npm install
# or
yarn
```

### 3. Configure environment variables

Create `.env` and `.env.local` files with your API URLs and secrets.

### 4. Start the project

```bash
npx expo start
```

---

## 🛠️ Development Tips

* 📦 **Native Modules?** Use EAS Build for native dependencies
* 🎨 **Styling?** Tailwind via NativeWind + Shadcn components
* 🧪 **Testing?** Set up Jest or Detox if needed
* 🔐 **Auth?** OTP auth integrated via Strapi or custom service

---

## 📈 Future Enhancements

* Push notifications for booking status
* In-app chat with agents
* Admin-level analytics dashboard
* Document OCR for auto-validation

---

## 🤝 Contributors

Built with ❤️ by the team 
