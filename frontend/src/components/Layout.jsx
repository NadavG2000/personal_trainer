import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dumbbell, User, BarChart, Bot } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: BarChart, path: createPageUrl("Dashboard") },
    { name: "Profile", icon: User, path: createPageUrl("Onboarding") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 hidden md:flex flex-col h-screen bg-white border-r border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-10 px-2">
            <Dumbbell className="w-8 h-8 text-green-500" />
            <span className="text-xl font-bold text-gray-800">FitGenius</span>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? "bg-green-50 text-green-600 font-semibold"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Bot className="w-8 h-8 mx-auto text-green-500 mb-2"/>
              <h4 className="font-semibold mb-1">AI Coach</h4>
              <p className="text-xs text-gray-600">Your plan adapts to you. Provide feedback to improve it weekly.</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-full rounded-md py-1 transition-colors duration-200 ${
              location.pathname === item.path ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}