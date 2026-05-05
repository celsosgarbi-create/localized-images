import { NavLink } from 'react-router-dom';
import { Images, Languages, Layers } from 'lucide-react';

const navItems = [
  { to: '/images', icon: Images, label: 'Images' },
  { to: '/localization', icon: Languages, label: 'Localization' },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col items-center w-16 min-h-screen bg-white border-r border-gray-200 py-4 gap-1">
      <div className="flex items-center justify-center w-10 h-10 mb-6">
        <Layers className="w-7 h-7 text-violet-600" />
      </div>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5 transition-colors ${
              isActive
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
