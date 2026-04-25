import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSettings = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  // 1. DYNAMIC LANGUAGE RESOLUTION
  // Instead of hardcoding, we query i18next's store to get all defined languages.
  const definedLanguages = Object.keys(i18n.store.data || {});

  // Mapping codes to native display labels as seen in your second image.
  const languageMap = {
    'en': { native: 'English (US)', sub: 'ENGLISH' },
    'en-GB': { native: 'English (UK)', sub: 'ENGLISH (UK)' },
    'fr': { native: 'Français', sub: 'FRENCH' },
    'fr-CA': { native: 'Français (Canada)', sub: 'FRENCH (CANADA)' },
    'es': { native: 'Español', sub: 'SPANISH' },
    'es-419': { native: 'Español (Latinoamérica)', sub: 'SPANISH (LATAM)' },
    'de': { native: 'Deutsch', sub: 'GERMAN' },
    'pcm': { native: 'Pidgin (Naija)', sub: 'PIDGIN' },
    'yo': { native: 'Èdè Yorùbá', sub: 'YORUBA' },
    'az': { native: 'Azərbaycanca', sub: 'AZERBAIJANI' },
    'id': { native: 'Bahasa Indonesia', sub: 'INDONESIAN' },
    'ms': { native: 'Bahasa Melayu', sub: 'MALAY' },
    'jv': { native: 'Basa Jawa', sub: 'JAVANESE' },
    'ca': { native: 'Català', sub: 'CATALAN' },
    'ceb': { native: 'Cebuano', sub: 'CEBUANO' },
    'cs': { native: 'Čeština', sub: 'CZECH' },
    'da': { native: 'Dansk', sub: 'DANISH' },
    'et': { native: 'Eesti', sub: 'ESTONIAN' }
    // As you add translations to i18n.js, define their labels here.
  };

  // Build the list dynamically based on what i18next actually supports.
  const allLanguages = definedLanguages
    .map(code => ({
      code,
      label: languageMap[code]?.native || code.toUpperCase(), // Fallback to code if label undefined
      sub: languageMap[code]?.sub || ''
    }))
    // Sort alphabetically by native name for a professional feel
    .sort((a, b) => a.label.localeCompare(b.label));

  // 2. STATE & INTERACTION
  const [selectedTempCode, setSelectedTempCode] = useState(i18n.language);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (code) => {
    setSelectedTempCode(code);
  };

  // 'Done' button now commits the change and navigates back.
  const handleConfirm = () => {
    i18n.changeLanguage(selectedTempCode);
    navigate(-1);
  };

  const isChanged = selectedTempCode !== i18n.language;

  // Filter based on search input
  const filteredLanguages = allLanguages.filter(lang => 
    lang.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[#06382a] text-white z-[600] flex flex-col font-sans overflow-hidden">
      {/* 3. NEW HEADER ARCHITECTURE */}
      {/* Adopts the 'Cancel - Title - Done' pattern from reference image 2 */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#042d22]">
        <button 
          onClick={() => navigate(-1)} 
          className="text-white opacity-80 text-sm font-bold active:opacity-100"
        >
          Cancel
        </button>
        <h1 className="text-lg font-black text-white italic uppercase tracking-tight text-center">
          App Language
        </h1>
        <button 
          onClick={handleConfirm}
          disabled={!isChanged}
          className={`text-sm font-bold transition-opacity ${
            isChanged ? 'text-white opacity-100' : 'text-zinc-600 opacity-50'
          }`}
        >
          Done
        </button>
      </div>

      {/* 4. SEARCH INTEGRATION */}
      {/* Professional search utility required for "all languages" */}
      <div className="p-4 border-b border-white/10 bg-[#042d22]">
        <div className="flex items-center gap-3 bg-[#0a4d38] p-3 rounded-full border border-white/5">
          <Search size={18} className="text-zinc-500" />
          <input 
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* 5. DYNAMIC LIST GENERATION */}
      {/* Switched from cards to list items with a radio-style indicator */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
        <div className="space-y-1">
          {filteredLanguages.length === 0 && (
            <div className="p-10 text-center text-zinc-600 italic text-sm">
              No matching languages found
            </div>
          )}
          
          <AnimatePresence>
            {filteredLanguages.map((lang) => {
              const isSelected = selectedTempCode === lang.code;
              return (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-base text-white tracking-tight">
                      {lang.label}
                    </span>
                    {lang.sub && (
                      <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">
                        {lang.sub}
                      </span>
                    )}
                  </div>
                  
                  {/* 6. RADIO INDICATOR */}
                  {/* Switched from full box background to a radio-style dot indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-white bg-white' : 'border-zinc-700'
                  }`}>
                    {isSelected && (
                      <Check size={12} className="text-[#06382a]" strokeWidth={4} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
