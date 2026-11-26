import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { saveLanguageSetting } from '../storage/activityDatabase';
import { Strings } from './en';
import {
  getStrings,
  LanguageSetting,
  resolveLanguage,
  setCurrentLanguage,
} from './language';

type LanguageState = {
  setting: LanguageSetting;
  strings: Strings;
  changeSetting: (setting: LanguageSetting) => void;
};

// Without a provider, as in most tests, the app uses the phone's language.
const LanguageContext = createContext<LanguageState>({
  setting: 'system',
  strings: getStrings(),
  changeSetting: () => {},
});

type Props = {
  initialSetting: LanguageSetting;
  children: ReactNode;
};

export function LanguageProvider({ initialSetting, children }: Props) {
  // The dates and notifications read the language outside React, so it is set
  // before the first screen is drawn.
  const [setting, setSetting] = useState(() => {
    setCurrentLanguage(resolveLanguage(initialSetting));
    return initialSetting;
  });
  const value = useMemo(
    () => ({
      setting,
      strings: getStrings(resolveLanguage(setting)),
      changeSetting: (next: LanguageSetting) => {
        // Set before drawing again, so the dates and notifications follow too.
        setCurrentLanguage(resolveLanguage(next));
        setSetting(next);
        saveLanguageSetting(next).catch(console.error);
      },
    }),
    [setting],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useStrings(): Strings {
  return useContext(LanguageContext).strings;
}

export function useLanguageSetting(): Pick<LanguageState, 'setting' | 'changeSetting'> {
  const { setting, changeSetting } = useContext(LanguageContext);
  return { setting, changeSetting };
}
