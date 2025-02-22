import { ThemeProvider } from "./components/theme-provider";
import { ThemeToggle } from "./components/theme-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Book Summarizer
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {/* Content will go here */}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
