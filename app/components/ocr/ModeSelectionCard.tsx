interface ModeSelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  gradientClass: string;
  onClick: () => void;
}

export default function ModeSelectionCard({ title, description, icon, buttonText, gradientClass, onClick }: ModeSelectionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer" onClick={onClick}>
      <div className="flex flex-col items-center">
        <div className={`w-32 h-32 rounded-full ${gradientClass} flex items-center justify-center mb-6 shadow-lg`}>
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 text-center mb-6">{description}</p>
        <button className={`px-8 py-3 ${gradientClass.replace('bg-gradient-to-br', 'bg-gradient-to-r')} hover:opacity-90 text-white rounded-xl font-semibold text-lg shadow-lg`}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}
