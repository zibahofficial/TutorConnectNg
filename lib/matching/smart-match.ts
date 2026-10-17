import type { Tutor } from "@/lib/types";

export interface MatchPreferences {
  subject: string;
  maxBudget: number;
  curriculum: string;
  location: string;
  availability: "All" | "Weekdays" | "Weekends";
}

export interface TutorMatch {
  tutor: Tutor;
  score: number;
  reasons: string[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKENDS = ["Sat", "Sun"];

const SUBJECT_GROUPS: Record<string, string[]> = {
  Maths: [
    "maths",
    "mathematics",
    "further mathematics",
  ],
  Sciences: [
    "agricultural science",
    "biology",
    "chemistry",
    "physics",
  ],
  Tech: [
    "computer science",
    "data analysis",
    "web development",
  ],
  Languages: [
    "english language",
    "french",
    "hausa",
    "igbo",
    "yoruba",
    "literature in english",
    "phonics reading",
  ],
  Commercial: [
    "accounting",
    "financial accounting",
    "business studies",
    "economics",
  ],
  "Exam Prep": [
    "ielts preparation",
    "jamb utme coaching",
    "waec neco prep",
  ],
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\uFE0F]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function matchesSubject(tutor: Tutor, subject: string): boolean {
  const selected = normalize(subject);

  if (!selected || selected === "all") {
    return true;
  }

  const tutorSubjects = Array.isArray(tutor.subjects)
    ? tutor.subjects.map(normalize).filter(Boolean)
    : [];

  const category = normalize(tutor.subjectCategory);

  // Preserve support for searches using the older broad categories.
  const selectedCategory = Object.keys(SUBJECT_GROUPS).find(
    (key) => normalize(key) === selected,
  );

  if (selectedCategory) {
    const related = SUBJECT_GROUPS[selectedCategory].map(normalize);

    if (
      tutorSubjects.some((tutorSubject) =>
        related.some(
          (item) =>
            tutorSubject === item ||
            tutorSubject.includes(item) ||
            item.includes(tutorSubject),
        ),
      )
    ) {
      return true;
    }
  }

  // Match the exact individual subject selected by the student.
  if (
    tutorSubjects.some(
      (tutorSubject) =>
        tutorSubject === selected ||
        tutorSubject.includes(selected) ||
        selected.includes(tutorSubject),
    )
  ) {
    return true;
  }

  // Use the tutor's category as a fallback when subject details are absent.
  const subjectCategoryMap: Record<string, string> = {
    mathematics: "maths",
    "further mathematics": "maths",
    "agricultural science": "sciences",
    biology: "sciences",
    chemistry: "sciences",
    physics: "sciences",
    "computer science": "tech",
    "data analysis": "tech",
    "web development": "tech",
    "english language": "languages",
    french: "languages",
    hausa: "languages",
    igbo: "languages",
    yoruba: "languages",
    "literature in english": "languages",
    accounting: "commercial",
    "financial accounting": "commercial",
    "business studies": "commercial",
    economics: "commercial",
    "ielts preparation": "exam prep",
    "jamb utme coaching": "exam prep",
    "waec neco prep": "exam prep",
  };

  const expectedCategory = subjectCategoryMap[selected];

  return Boolean(
    expectedCategory && category === normalize(expectedCategory),
  );
}

function matchesAvailability(
  tutor: Tutor,
  preference: MatchPreferences["availability"],
): boolean {
  if (preference === "All") {
    return true;
  }

  const allowedDays =
    preference === "Weekdays" ? WEEKDAYS : WEEKENDS;

  return (
    Array.isArray(tutor.availability) &&
    tutor.availability.some((slot) =>
      allowedDays.includes(slot.day),
    )
  );
}

function matchesLocation(tutor: Tutor, location: string): boolean {
  const selected = normalize(location);

  if (!selected || selected === "all") {
    return true;
  }

  if (selected.includes("online") || selected.includes("remote")) {
    return tutor.isOnline;
  }

  const area = normalize(tutor.area || "");
  const state = normalize(tutor.state || "");

  const parts = selected.match(/^(.+?)\s*\((.+?)\)$/);

  if (parts) {
    return (
      state.includes(normalize(parts[1])) &&
      area.includes(normalize(parts[2]))
    );
  }

  return state.includes(selected) || area.includes(selected);
}

export function calculateTutorMatches(
  tutors: Tutor[],
  preferences: MatchPreferences,
): TutorMatch[] {
  const hasSubjectPreference =
    normalize(preferences.subject) !== "" &&
    normalize(preferences.subject) !== "all";

  const hasBudgetPreference =
    Number.isFinite(preferences.maxBudget) &&
    preferences.maxBudget > 0;

  const hasCurriculumPreference =
    normalize(preferences.curriculum) !== "" &&
    normalize(preferences.curriculum) !== "all";

  const hasLocationPreference =
    normalize(preferences.location) !== "" &&
    normalize(preferences.location) !== "all";

  const hasAvailabilityPreference =
    preferences.availability !== "All";

  return tutors
    .filter((tutor) => {
      if (
        hasSubjectPreference &&
        !matchesSubject(tutor, preferences.subject)
      ) {
        return false;
      }

      if (
        hasBudgetPreference &&
        tutor.hourlyRate > preferences.maxBudget
      ) {
        return false;
      }

      return true;
    })
    .map((tutor): TutorMatch => {
      let earnedPoints = 0;
      let possiblePoints = 0;
      const reasons: string[] = [];

      if (hasSubjectPreference) {
        reasons.push(
          `Teaches a subject related to ${preferences.subject.trim()}`,
        );
      }

      if (hasBudgetPreference) {
        reasons.push("Within your hourly budget");
      }

      if (hasCurriculumPreference) {
        possiblePoints += 30;

        if (
          normalize(tutor.curriculum) ===
          normalize(preferences.curriculum)
        ) {
          earnedPoints += 30;
          reasons.push("Matches your preferred curriculum");
        }
      }

      if (hasLocationPreference) {
        possiblePoints += 20;

        if (matchesLocation(tutor, preferences.location)) {
          earnedPoints += 20;
          reasons.push(
            normalize(preferences.location).includes("online") ||
              normalize(preferences.location).includes("remote")
              ? "Offers online lessons"
              : "Matches your location preference",
          );
        }
      }

      if (hasAvailabilityPreference) {
        possiblePoints += 10;

        if (matchesAvailability(tutor, preferences.availability)) {
          earnedPoints += 10;
          reasons.push(
            `Available on ${preferences.availability.toLowerCase()}`,
          );
        }
      }

      possiblePoints += 10;

      if (tutor.isVerified) {
        earnedPoints += 5;
        reasons.push("Verified tutor");
      }

      if (tutor.totalReviews > 0 && tutor.ratingAvg >= 4) {
        earnedPoints += 5;
        reasons.push("Rated 4 stars or higher");
      }

      const score =
        possiblePoints > 0
          ? Math.round((earnedPoints / possiblePoints) * 100)
          : 0;

      return { tutor, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.tutor.ratingAvg - a.tutor.ratingAvg ||
        a.tutor.hourlyRate - b.tutor.hourlyRate,
    );
}
