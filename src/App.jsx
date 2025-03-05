/* eslint-disable react/prop-types */
import { useState } from 'react';
import './App.css';
import ShulteTable from './ShulteTable';
import FindNumbers from './FindNumbers';

function App() {
  const [activeComponent, setActiveComponent] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (component) => {
    setActiveComponent(component);
    setMenuOpen(false);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'schulte':
        return <ShulteTable />;
      case 'findnumbers':
        return <FindNumbers />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
            <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cognitive Training Games
            </h1>
            <p className="text-xl text-center max-w-2xl mb-10 text-gray-700 dark:text-gray-300">
              Improve your peripheral vision, focus, and reaction time with our collection of cognitive training games.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <GameCard 
                title="Schulte Table" 
                description="Find numbers in sequence to improve peripheral vision and attention"
                onClick={() => navigate('schulte')}
              />
              <GameCard 
                title="Find Numbers" 
                description="Test your visual scanning and processing speed abilities"
                onClick={() => navigate('findnumbers')}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modern Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => navigate('home')} 
                  className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                >
                  CogniGames
                </button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink 
                  isActive={activeComponent === 'home'} 
                  onClick={() => navigate('home')}
                >
                  Home
                </NavLink>
                <NavLink 
                  isActive={activeComponent === 'schulte'} 
                  onClick={() => navigate('schulte')}
                >
                  Schulte Table
                </NavLink>
                <NavLink 
                  isActive={activeComponent === 'findnumbers'} 
                  onClick={() => navigate('findnumbers')}
                >
                  Find Numbers
                </NavLink>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {menuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <MobileNavLink 
                isActive={activeComponent === 'home'} 
                onClick={() => navigate('home')}
              >
                Home
              </MobileNavLink>
              <MobileNavLink 
                isActive={activeComponent === 'schulte'} 
                onClick={() => navigate('schulte')}
              >
                Schulte Table
              </MobileNavLink>
              <MobileNavLink 
                isActive={activeComponent === 'findnumbers'} 
                onClick={() => navigate('findnumbers')}
              >
                Find Numbers
              </MobileNavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderComponent()}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} CogniGames - Cognitive Training Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

// Navigation Link Component for Desktop
function NavLink({ children, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive
          ? 'border-blue-500 text-gray-900 dark:text-white'
          : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// Navigation Link Component for Mobile
function MobileNavLink({ children, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

// Game Card Component for Home Screen
function GameCard({ title, description, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <div className="mt-auto">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Start Training
        </button>
      </div>
    </div>
  );
}

export default App;