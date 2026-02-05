# Apex Scholar

A Kahoot-style React Native app built with Expo for managing classes, students, points, and experience tracking.

## Features

- **Home Screen**: Simple navigation to view classes or add a new class
- **Class Management**: 
  - View all classes as beautiful gradient cards
  - Add new classes with student lists (via text file upload or manual entry)
- **Class Detail Screen**:
  - Auto-repeating countdown timer with sound notifications
  - Student list with points tracking
  - Quick actions to add points to students
  - Add experience to the class
  - Rank progression system with visual progress bar

## Getting Started

### Prerequisites

- Node.js (v20.19.x or higher)
- npm or yarn
- Expo Go app on your mobile device (iOS or Android) - SDK 54 compatible version

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

```
Apex-Scholar/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Home screen
│   ├── classes/           # Class management screens
│   └── class/[id].tsx     # Class detail screen
├── components/            # Reusable components
│   ├── Button.tsx
│   ├── ClassCard.tsx
│   ├── StudentCard.tsx
│   ├── Timer.tsx
│   └── RankProgress.tsx
├── services/              # Business logic
│   ├── storage.ts        # Data persistence
│   └── rankSystem.ts     # Rank calculations
├── types/                 # TypeScript types
├── constants/            # App constants
│   ├── colors.ts        # Color palette
│   └── ranks.ts         # Rank definitions
└── utils/               # Utility functions
    └── sound.ts         # Sound notifications
```

## Usage

### Adding a Class

1. Tap "Add Class" on the home screen
2. Enter a class name (e.g., "Grade 4M")
3. Upload a text file with student names (one per line) OR add students manually
4. Tap "Create Class"

### Managing Students

1. Select a class from "My Classes"
2. Use the timer to track class sessions
3. Add points to students using:
   - Quick action buttons (+1, +5, +10)
   - "Add Points" button for custom amounts
4. Add experience to the class using "Add Experience" button

### Rank System

Classes progress through ranks based on experience:
- Beginner (0 XP)
- Novice (100 XP)
- Apprentice (250 XP)
- Expert (500 XP)
- Master (1000 XP)
- Grandmaster (2000 XP)

The progress bar shows current rank, progress to next rank, and next rank badge.

## Data Storage

Currently uses AsyncStorage for local persistence. The storage service is abstracted to allow easy migration to MongoDB in the future.

## Technologies

- React Native 0.81
- React 19.1.0
- Expo SDK 54
- Expo Router 6.x (file-based routing)
- TypeScript
- AsyncStorage
- Expo AV (audio)
- Expo Linear Gradient
- Expo Document Picker

## Notes

- Timer automatically resets when it reaches 0 and plays a notification sound
- When students earn points, the class automatically gains equivalent experience
- All data is stored locally on the device
