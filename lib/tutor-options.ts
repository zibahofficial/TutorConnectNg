/**
 * Shared tutor option lists — used by the tutor signup form and the
 * tutor dashboard's profile editor so both always offer identical choices.
 */

export const TUTOR_HEADLINES = [
  "Mathematics & Further Mathematics tutor (WAEC, NECO, JAMB)",
  "English & Literature tutor (WAEC, NECO, JAMB)",
  "Physics, Chemistry & Biology tutor (senior secondary)",
  "Chemistry & Biology tutor for senior secondary students",
  "Primary school tutor (all subjects, Grades 1-6)",
  "ICT, Computer Science & Coding tutor",
  "Economics, Government & Commerce tutor",
  "Accounting & Business Studies tutor",
  "Geography & Environmental Science tutor",
  "History & Social Studies tutor",
  "Music, Piano & Voice tutor",
  "French & Foreign Languages tutor",
  "JAMB / UTME & Post-UTME coaching specialist",
  "IGCSE, SAT & IELTS preparation specialist",
  "Special-needs & home-schooling tutor",
  "University admission & essay-writing coach",
];

export const TUTOR_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "Federal Capital Territory (Abuja)",
];

export const QUALIFICATIONS = [
  "B.Sc. / B.A. / B.Eng. (Bachelor's degree)",
  "B.Sc. / B.A. (First Class Honours)",
  "Master's degree (M.Sc. / M.A. / M.Eng.)",
  "Doctorate (PhD / EdD)",
  "MBBS / BDS (Medical degree)",
  "NCE (Nigeria Certificate in Education)",
  "PGDE / Postgraduate Diploma in Education",
  "HND / Diploma",
  "Professional certification (ICAN, CIBN, CISCO, TRCN)",
  "WAEC / NECO certificate + verifiable teaching experience",
];

export const TEACHING_MODES = ["Online & in person", "Online only", "In person only"];

export const TUTOR_DOCUMENT_TYPES = [
  { value: "Government-issued ID", hint: "NIN slip, voter's card, driver's licence or international passport" },
  { value: "Academic credential", hint: "degree, HND, NCE, diploma or transcript" },
  { value: "Professional certificate", hint: "e.g. TRCN registration certificate" },
  { value: "Other supporting document", hint: "any other proof of your expertise" },
];

export const TUTOR_DOCUMENT_TYPE_VALUES = TUTOR_DOCUMENT_TYPES.map((t) => t.value);
