/**
 * Generated house terms (spec §5, "Generated terms"). OWNER: h1. Pure.
 * Every term carries a visible "why" derived from the household's answers.
 */
import { QUESTIONS, type Answers, type ISODate, type PublicUser, type Term } from "./types";

export interface TermsInput {
  incoming: PublicUser & { answers: Answers; startDate: ISODate; endDate: ISODate };
  stayers: Array<PublicUser & { answers: Answers }>;
  listing: { startDate: ISODate; endDate: ISODate };
}

function fmt(d: ISODate): string {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function names(people: PublicUser[]): string {
  const n = people.map((p) => p.name);
  if (n.length <= 1) return n.join("");
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

export function generateTerms({ incoming, stayers, listing }: TermsInput): Term[] {
  const everyone = [incoming, ...stayers];
  const terms: Term[] = [];

  // dates
  terms.push({
    key: "dates",
    text: `Dates: ${fmt(incoming.startDate)} to ${fmt(incoming.endDate)}`,
    why: `${incoming.name}'s requested stay. The room is available ${fmt(listing.startDate)} to ${fmt(listing.endDate)}.`,
  });

  // quiet — earliest bedtime in the house sets quiet hours
  const earliest = Math.min(...everyone.map((p) => p.answers[0]));
  const earlyBirds = everyone.filter((p) => p.answers[0] === earliest);
  const bed = QUESTIONS[0].phrases[earliest];
  terms.push({
    key: "quiet",
    text:
      earliest === 0
        ? "Quiet after 11pm on weeknights"
        : earliest === 1
          ? "Quiet after 1am on weeknights"
          : "No set quiet hours; check in if a schedule changes",
    why: `Earliest bedtime in the house: ${names(earlyBirds)} (lights out ${bed}).`,
  });

  // guests — driven by the most frequent overnight-guest answer
  const maxOvernight = Math.max(...everyone.map((p) => p.answers[3]));
  const frequent = everyone.filter((p) => p.answers[3] === maxOvernight);
  terms.push({
    key: "guests",
    text:
      maxOvernight === 2
        ? "Text the house before an overnight guest; agree on a weekly limit"
        : maxOvernight === 1
          ? "Text the house before an overnight guest"
          : "Ask the house before any overnight guest",
    why:
      maxOvernight === 0
        ? "Nobody in the house had overnight guests last month."
        : `${names(frequent)} had overnight guests ${QUESTIONS[3].phrases[maxOvernight]} last month.`,
  });

  // kitchen — middle (median, lower) of everyone's dish answers
  const dishes = everyone.map((p) => p.answers[5]).sort((a, b) => a - b);
  const mid = dishes[Math.floor((dishes.length - 1) / 2)];
  terms.push({
    key: "kitchen",
    text:
      mid === 0
        ? "Dishes washed right after cooking"
        : mid === 1
          ? "Dishes washed the same day"
          : "Dishes washed by the next day",
    why: `Middle of everyone's answers: dishes get washed ${QUESTIONS[5].phrases[mid]}.`,
  });

  // issues — majority answer (ties go to the more direct option)
  const counts = [0, 0, 0];
  everyone.forEach((p) => counts[p.answers[7]]++);
  const best = Math.max(...counts);
  const majority = counts.indexOf(best);
  terms.push({
    key: "issues",
    text:
      majority === 0
        ? "Raise problems in person within a day or two"
        : majority === 1
          ? "Raise problems by text within a day or two"
          : "Hold a short house check-in every two weeks so problems don't slide",
    why:
      majority === 2
        ? `Most of the house (${best} of ${everyone.length}) tends to let problems slide, so a check-in makes room to raise them.`
        : `Most of the house (${best} of ${everyone.length}) prefers raising problems ${QUESTIONS[7].phrases[majority]}.`,
  });

  return terms;
}
