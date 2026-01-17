# 📊 Cook & Helper Attendance Tracker

A premium, easy-to-use React Native application to track attendance and calculate salaries for domestic helpers (Cook, Maid, Milkman, etc.).

## ✨ Features

- **👥 Multi-Worker Support**: seamlessly switch between different profiles (Cook, Maid, Milk).
- **📝 Tri-State Attendance**: Mark shifts as **Present** (Green), **Absent** (Red), or leave as **Unmarked** (Gray).
- **☀️/🌙 Shift Tracking**: Track Morning and Evening shifts separately.
- **⚙️ Configurable Shifts**: Enable/Disable specific shifts per worker (e.g., Milkman only comes in the Morning).
- **💰 Smart Salary Calculation**: 
  - Automatically excludes Sundays from working days.
  - Calculates pay based on *Completed Shifts* vs *Total Possible Shifts*.
  - Helper logic: 1 Shift = Full Pay (if only 1 shift enabled), 2 Shifts = Split Pay.
- **📅 Visual Calendar**: View monthly attendance at a glance with color-coded indicators.
- **💾 Offline Persistence**: All data is saved locally on the device.

## 📱 Screenshots

| Dashboard | Calendar | Payments & Settings |
|:---:|:---:|:---:|
| *(Add Dashboard Screenshot)* | *(Add Calendar Screenshot)* | *(Add Payments Screenshot)* |

## 🛠 Tech Stack

- **Framework**: React Native (Expo SDK 49)
- **Language**: JavaScript / React
- **Navigation**: React Navigation v6 (Bottom Tabs)
- **Storage**: @react-native-async-storage/async-storage
- **UI Components**: react-native-calendars, react-native-safe-area-context, react-native-svg

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/rahulanand2690/CookTracker.git
    cd CookTracker
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the app**:
    ```bash
    npx expo start
    ```

4.  **Run on Device**:
    - Download **Expo Go** from Play Store (Android) or App Store (iOS).
    - Scan the QR code shown in the terminal.

## 📖 Usage Guide

1.  **Select a Worker**: Tap the chips (Cook/Maid/Milk) on the top of the Home screen.
2.  **Mark Attendance**:
    - Tap the **Sun** (Morning) or **Moon** (Evening) cards to toggle status.
    - Status loops: `Unmarked` -> `Present` -> `Absent`.
3.  **Edit Calendar**: Go to the **Calendar** tab and tap any date to edit past attendance.
4.  **Configure Salary & Shifts**:
    - Go to **Payments**.
    - Set the **Base Salary** (e.g., ₹6000).
    - Toggle Morning/Evening switches to match the worker's schedule.

## 📄 License
MIT
