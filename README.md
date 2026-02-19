# Eisenhower Matrix with Google Tasks Integration

A modern, productivity-focused web application that brings the [Eisenhower Matrix](https://todoist.com/productivity-methods/eisenhower-matrix) methodology to your Google Tasks.

![App Icon](./public/favicon.svg)

## Features

- **Google Tasks Sync**: Seamlessly integrates with your Google account. Tasks are stored in your default task list.
- **Eisenhower Matrix**: Visual layout with 4 quadrants:
  - **Do First** (Urgent & Important)
  - **Schedule** (Not Urgent & Important)
  - **Delegate** (Urgent & Not Important)
  - **Delete** (Not Urgent & Not Important)
- **Cross-Device Sync**: Your matrix layout is preserved across devices! We use a special tag system (e.g., `[#q:do-first]`) in the task notes to remember where each task belongs.
- **Mobile Friendly**: Responsive design that switches to a vertical stack view on mobile for easy task management on the go.
- **Due Dates**: Set deadlines for your tasks and see when they are due. Overdue tasks are highlighted.
- **Illustrated Empty States**: Beautiful, motivating illustrations when you clear a quadrant.

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: TailwindCSS
- **State Management**: React Context + Google Tasks API
- **Drag & Drop**: `@dnd-kit`

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Google Cloud Project with the **Google Tasks API** enabled.
- An **OAuth 2.0 Client ID** configured for a Web Application.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/eisenhower-matrix.git
    cd eisenhower-matrix
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure Environment Variables:**

    > **IMPORTANT:** Never commit your actual `.env` file containing your Client ID. This project uses a `.env` file which is git-ignored to protect your keys.

    Create a `.env` file in the root directory based on the example:

    ```bash
    cp .env.example .env
    ```

    Open `.env` and add your Google Client ID:

    ```env
    VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    ```

4. **Run the Development Server:**

    ```bash
    npm run dev
    ```

    The app should now be running at `http://localhost:5173`.

## Deployment

To build the app for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory, ready to be deployed to Vercel, Netlify, or any static hosting service.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
