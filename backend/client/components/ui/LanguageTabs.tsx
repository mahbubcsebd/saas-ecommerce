
interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageTabsProps {
  languages: Language[];
  selectedLang: string;
  onChange: (code: string) => void;
  errors?: Record<string, boolean>; // e.g., { 'en': true }
}

export default function LanguageTabs({ languages, selectedLang, onChange, errors = {} }: LanguageTabsProps) {
  if (languages.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 border-b pb-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors border-b-2
            ${
              selectedLang === lang.code
                ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
            ${errors[lang.code] ? "text-red-600 bg-red-50" : ""}
          `}
        >
          <span className="text-lg">{lang.flag}</span>
          {/* <span>{lang.name}</span> */}
          {errors[lang.code] && <span className="w-2 h-2 rounded-full bg-red-500 ml-1" />}
        </button>
      ))}
    </div>
  );
}
