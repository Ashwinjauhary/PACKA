import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'gov.india': 'GOVERNMENT OF INDIA',
    'gov.skip': 'Skip to Main Content',
    'gov.screenReader': 'Screen Reader / High Contrast',
    'gov.ministry': 'Ministry of Consumer Affairs, Food & Public Distribution',
    'gov.dept': 'Department of Consumer Affairs',
    'gov.app': 'PACKA: Packaged Commodity Compliance Assistant',
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.guidelines': 'LMPC Guidelines',
    'nav.circulars': 'Circulars',
    'nav.contact': 'Contact Us',
    
    'landing.title': 'Legal Metrology (Packaged Commodities) Compliance Assistant',
    'landing.subtitle': 'An official portal to assist manufacturers, importers, and packers in ensuring compliance with the mandatory declarations under the Legal Metrology Act, 2009 and Rules, 2011.',
    'landing.infoTitle': 'Information & Guidelines',
    'landing.infoDesc': 'The Packaged Commodities Rules strictly enforce the declaration of MRP, Net Quantity, Manufacturer Details, Consumer Care details, and Date of Manufacturing on all pre-packaged commodities sold in India.',
    'landing.loginTitle': 'Portal Login',
    'landing.loginDesc': 'Authorized users can log in to perform automated AI-based compliance scans on commodity packages.',
    'landing.loginBtn': 'Login to PACKA',
    'landing.newUser': 'New User?',
    'landing.register': 'Register Here',
    'landing.standardsTitle': 'Check Compliance Standards',
    'landing.standardsDesc': 'View the latest guidelines and rulebooks regarding packaged commodity labelling.',
    'landing.viewRulebook': 'View Rulebook',

    'footer.quickLinks': 'Quick Links',
    'footer.home': 'Home',
    'footer.aboutDept': 'About Department',
    'footer.lmRules': 'Legal Metrology Rules',
    'footer.grievance': 'Consumer Grievance',
    'footer.policies': 'Policies',
    'footer.websitePolicies': 'Website Policies',
    'footer.disclaimer': 'Disclaimer',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.contact': 'Contact Us',
    'footer.address': 'Krishi Bhawan, New Delhi - 110001',
    'footer.email': 'Email: dir-lm-ca@nic.in',
    'footer.helpline': 'Helpline: 1800-11-4000',
    'footer.copyright': 'This site is designed, developed and hosted by National Informatics Centre (NIC), Ministry of Electronics & Information Technology, Government of India.',

    'auth.instructionsTitle': 'Important Instructions',
    'auth.inst1': 'Registration is mandatory for all manufacturers, packers, and importers under the Legal Metrology (Packaged Commodities) Rules, 2011.',
    'auth.inst2': 'Ensure all submitted declarations match the physical packages.',
    'auth.inst3': 'Use the scanning tool to verify compliance before market launch.',
    'auth.inst4': 'Non-compliance may lead to penalties as per the LMPC Act.',
    'auth.inst5': 'For any technical assistance, contact the NIC helpdesk at 1800-11-4000.',

    'login.title': 'Authorized Login',
    'login.subtitle': 'Enter your credentials to access the portal.',
    'login.email': 'Email Address',
    'login.emailPlaceholder': 'example@nic.in or company@domain.com',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter password',
    'login.btn': 'Secure Login',
    'login.loading': 'Authenticating...',
    'login.noAccount': "Don't have an account?",
    'login.registerLink': 'Register as a New User',
    'login.badge': 'Only for authorized manufacturers, packers, importers, and LMPC officers.',

    'register.title': 'New User Registration',
    'register.subtitle': 'Create your official LMPC compliance account.',
    'register.org': 'Organization Name',
    'register.orgPlaceholder': 'e.g. ITC Limited',
    'register.name': 'Full Name',
    'register.namePlaceholder': 'Enter your full name',
    'register.confirmPass': 'Confirm Password',
    'register.btn': 'Create Official Account',
    'register.loading': 'Creating Account...',
    'register.hasAccount': 'Already registered?',
    'register.loginLink': 'Return to Login',
    'register.passMismatch': 'Passwords do not match',

    'sidebar.dashboard': 'Dashboard',
    'sidebar.newScan': 'New Scan',
    'sidebar.history': 'Scan History',
    'sidebar.analytics': 'Analytics',
    'sidebar.rules': 'Rule Manager',
    'sidebar.subtitle': 'Compliance Assistant',

    'dashboard.welcome': 'Welcome back',
    'dashboard.subtitle': 'Here\'s your compliance monitoring overview',
    'dashboard.totalScans': 'Total Scans',
    'dashboard.complianceRate': 'Compliance Rate',
    'dashboard.nonCompliant': 'Non-Compliant',
    'dashboard.avgScore': 'Avg. Score',
    'dashboard.recentScans': 'Recent Scans',
    'dashboard.viewAll': 'View All',
    'dashboard.violationBreakdown': 'Violation Breakdown',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.scanPackage': 'Scan Package',
    'dashboard.scanDesc': 'Upload & analyze',
    'dashboard.historyDesc': 'View past scans',
    'dashboard.analyticsDesc': 'Trends & stats',
    'dashboard.noScans': 'No scans yet',
    'dashboard.noScansDesc': 'Start by scanning a packaged commodity to check its compliance with LMPC Rules, 2011.',
    'dashboard.startScan': 'Start First Scan',
    'dashboard.noViolations': 'No violations yet',
  },
  hi: {
    'gov.india': 'भारत सरकार',
    'gov.skip': 'मुख्य सामग्री पर जाएं',
    'gov.screenReader': 'स्क्रीन रीडर / उच्च कंट्रास्ट',
    'gov.ministry': 'उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय',
    'gov.dept': 'उपभोक्ता मामले विभाग',
    'gov.app': 'PACKA: पैक्ड कमोडिटी अनुपालन सहायक',
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.guidelines': 'LMPC दिशानिर्देश',
    'nav.circulars': 'परिपत्र',
    'nav.contact': 'संपर्क करें',
    
    'landing.title': 'विधिक मापविज्ञान (पैकबंद वस्तुएं) अनुपालन सहायक',
    'landing.subtitle': 'विधिक मापविज्ञान अधिनियम, 2009 और नियम, 2011 के तहत अनिवार्य घोषणाओं के अनुपालन को सुनिश्चित करने में निर्माताओं, आयातकों और पैकर्स की सहायता के लिए एक आधिकारिक पोर्टल।',
    'landing.infoTitle': 'जानकारी और दिशानिर्देश',
    'landing.infoDesc': 'पैकबंद वस्तु नियम भारत में बेची जाने वाली सभी पूर्व-पैक वस्तुओं पर एमआरपी, शुद्ध मात्रा, निर्माता विवरण, उपभोक्ता देखभाल विवरण और निर्माण की तारीख की घोषणा को सख्ती से लागू करते हैं।',
    'landing.loginTitle': 'पोर्टल लॉगिन',
    'landing.loginDesc': 'अधिकृत उपयोगकर्ता कमोडिटी पैकेजों पर स्वचालित एआई-आधारित अनुपालन स्कैन करने के लिए लॉग इन कर सकते हैं।',
    'landing.loginBtn': 'PACKA में लॉगिन करें',
    'landing.newUser': 'नए उपयोगकर्ता?',
    'landing.register': 'यहां पंजीकरण करें',
    'landing.standardsTitle': 'अनुपालन मानकों की जांच करें',
    'landing.standardsDesc': 'पैक्ड कमोडिटी लेबलिंग के संबंध में नवीनतम दिशानिर्देश और नियम पुस्तिकाएं देखें।',
    'landing.viewRulebook': 'नियम पुस्तिका देखें',

    'footer.quickLinks': 'त्वरित लिंक',
    'footer.home': 'होम',
    'footer.aboutDept': 'विभाग के बारे में',
    'footer.lmRules': 'विधिक मापविज्ञान नियम',
    'footer.grievance': 'उपभोक्ता शिकायत',
    'footer.policies': 'नीतियां',
    'footer.websitePolicies': 'वेबसाइट नीतियां',
    'footer.disclaimer': 'अस्वीकरण',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'नियम एवं शर्तें',
    'footer.contact': 'संपर्क करें',
    'footer.address': 'कृषि भवन, नई दिल्ली - 110001',
    'footer.email': 'ईमेल: dir-lm-ca@nic.in',
    'footer.helpline': 'हेल्पलाइन: 1800-11-4000',
    'footer.copyright': 'यह साइट राष्ट्रीय सूचना विज्ञान केंद्र (NIC), इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय, भारत सरकार द्वारा डिज़ाइन, विकसित और होस्ट की गई है।',

    'auth.instructionsTitle': 'महत्वपूर्ण निर्देश',
    'auth.inst1': 'लीगल मेट्रोलॉजी (पैकेज्ड कमोडिटीज) नियम, 2011 के तहत सभी निर्माताओं, पैकर्स और आयातकों के लिए पंजीकरण अनिवार्य है।',
    'auth.inst2': 'सुनिश्चित करें कि प्रस्तुत सभी घोषणाएं भौतिक पैकेजों से मेल खाती हैं।',
    'auth.inst3': 'बाज़ार में लॉन्च करने से पहले अनुपालन सत्यापित करने के लिए स्कैनिंग टूल का उपयोग करें।',
    'auth.inst4': 'गैर-अनुपालन पर एलएमपीसी अधिनियम के अनुसार जुर्माना हो सकता है।',
    'auth.inst5': 'किसी भी तकनीकी सहायता के लिए एनआईसी हेल्पडेस्क 1800-11-4000 पर संपर्क करें।',

    'login.title': 'अधिकृत लॉगिन',
    'login.subtitle': 'पोर्टल तक पहुंचने के लिए अपने क्रेडेंशियल दर्ज करें।',
    'login.email': 'ईमेल पता',
    'login.emailPlaceholder': 'example@nic.in या company@domain.com',
    'login.password': 'पासवर्ड',
    'login.passwordPlaceholder': 'पासवर्ड दर्ज करें',
    'login.btn': 'सुरक्षित लॉगिन',
    'login.loading': 'प्रमाणित किया जा रहा है...',
    'login.noAccount': "क्या आपके पास खाता नहीं है?",
    'login.registerLink': 'नए उपयोगकर्ता के रूप में पंजीकरण करें',
    'login.badge': 'केवल अधिकृत निर्माताओं, पैकर्स, आयातकों और एलएमपीसी अधिकारियों के लिए।',

    'register.title': 'नया उपयोगकर्ता पंजीकरण',
    'register.subtitle': 'अपना आधिकारिक एलएमपीसी अनुपालन खाता बनाएं।',
    'register.org': 'संगठन का नाम',
    'register.orgPlaceholder': 'उदा. आईटीसी लिमिटेड',
    'register.name': 'पूरा नाम',
    'register.namePlaceholder': 'अपना पूरा नाम दर्ज करें',
    'register.confirmPass': 'पासवर्ड की पुष्टि करें',
    'register.btn': 'आधिकारिक खाता बनाएं',
    'register.loading': 'खाता बनाया जा रहा है...',
    'register.hasAccount': 'पहले से पंजीकृत हैं?',
    'register.loginLink': 'लॉगिन पर लौटें',
    'register.passMismatch': 'पासवर्ड मेल नहीं खाते',

    'sidebar.dashboard': 'डैशबोर्ड',
    'sidebar.newScan': 'नया स्कैन',
    'sidebar.history': 'स्कैन इतिहास',
    'sidebar.analytics': 'विश्लेषण',
    'sidebar.rules': 'नियम प्रबंधक',
    'sidebar.subtitle': 'अनुपालन सहायक',

    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.subtitle': 'यहां आपका अनुपालन निगरानी अवलोकन है',
    'dashboard.totalScans': 'कुल स्कैन',
    'dashboard.complianceRate': 'अनुपालन दर',
    'dashboard.nonCompliant': 'गैर-अनुपालन',
    'dashboard.avgScore': 'औसत स्कोर',
    'dashboard.recentScans': 'हाल के स्कैन',
    'dashboard.viewAll': 'सभी देखें',
    'dashboard.violationBreakdown': 'उल्लंघन विवरण',
    'dashboard.quickActions': 'त्वरित कार्रवाइयां',
    'dashboard.scanPackage': 'पैकेज स्कैन करें',
    'dashboard.scanDesc': 'अपलोड और विश्लेषण करें',
    'dashboard.historyDesc': 'पिछले स्कैन देखें',
    'dashboard.analyticsDesc': 'रुझान और आंकड़े',
    'dashboard.noScans': 'अभी तक कोई स्कैन नहीं',
    'dashboard.noScansDesc': 'LMPC नियम, 2011 के साथ अनुपालन की जांच करने के लिए एक पैक की गई वस्तु को स्कैन करके प्रारंभ करें।',
    'dashboard.startScan': 'पहला स्कैन प्रारंभ करें',
    'dashboard.noViolations': 'अभी तक कोई उल्लंघन नहीं',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('packa_lang');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    localStorage.setItem('packa_lang', newLang);
    setLangState(newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
