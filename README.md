# My Precious 💍

A comprehensive personal finance and wealth management application built with React and Vite. "My Precious" helps you track your net worth, manage accounts across multiple currencies, and project your future financial status with ease.

## Features ✨

*   **💰 Multi-Currency Asset Tracking**: Monitor your accounts in **BRL**, **USD**, and **EUR** with automatic exchange rate conversion.
*   **📅 Financial Calendar**: Schedule and track recurring (monthly, bi-weekly, yearly) and one-time income and expenses.
*   **🏷️ Smart Categorization**: Organize transactions with automatic and manual categorization features.
*   **📈 Wealth Projections**: Visualize your future financial growth with wealth projection charts based on your current data and estimated yields.
*   **🔄 Offline-First Sync**: Robust data synchronization ensuring your data is always available, using **IndexedDB** for local storage and **Firebase Firestore** for cloud persistence.
*   **🔐 Secure Authentication**: Integrated Google Login via Firebase Authentication.
*   **📊 Interactive Dashboard**: Insightful charts for asset allocation, evolution, and income vs. expense analysis.

## Tech Stack 🛠️

*   **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript & JavaScript
*   **Styling**: [TailwindCSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Backend / Auth**: [Firebase](https://firebase.google.com/) (Auth, Firestore)
*   **State & Data**: [TanStack Query](https://tanstack.com/query/latest), [IDB](https://github.com/jakearchibald/idb) (IndexedDB wrapper)
*   **Charts**: [Recharts](https://recharts.org/), [Chart.js](https://www.chartjs.org/)

## Getting Started 🚀

Follow these steps to set up the project locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/my-precious.git
    cd my-precious
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Firebase configuration:

    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## Development Commands

*   `npm run dev`: Start the development server.
*   `npm run build`: Build the app for production.
*   `npm run lint`: Run ESLint to check for code quality issues.
*   `npm run preview`: Preview the production build locally.

## License

This project is private and proprietary.
