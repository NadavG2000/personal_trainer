import React from "react";

export default function MenuPage() {
  // Placeholder: Replace with real menu logic later
  const menu = [
    { meal: "Breakfast", items: ["Oatmeal", "Banana", "Almonds"] },
    { meal: "Lunch", items: ["Grilled Chicken", "Quinoa", "Broccoli"] },
    { meal: "Dinner", items: ["Salmon", "Sweet Potato", "Asparagus"] },
    { meal: "Snacks", items: ["Greek Yogurt", "Berries"] },
  ];

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Menu</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {menu.map((m) => (
          <div key={m.meal} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">{m.meal}</h2>
            <ul className="space-y-1">
              {m.items.map((item) => (
                <li key={item} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
} 