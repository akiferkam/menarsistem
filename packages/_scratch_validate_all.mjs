import { loadCurriculum } from "./curriculum/load.ts";

for (const subj of ["matematik", "geometri", "fizik", "kimya", "biyoloji", "tde"]) {
  try {
    const c = loadCurriculum(subj);
    const codes = c.outcomes.map(o => o.code);
    const dupes = codes.filter((x, i) => codes.indexOf(x) !== i);
    const shortOutcomes = c.outcomes.filter(o => o.outcome.length < 10);
    const shortMicro = c.outcomes.filter(o => o.micro.length < 2);
    console.log(subj, "OK", c.outcome_count, "outcomes; dupes:", [...new Set(dupes)].length, "shortOutcome:", shortOutcomes.length, "shortMicro:", shortMicro.length);
  } catch (e) {
    console.log(subj, "FAIL", e.message);
  }
}
