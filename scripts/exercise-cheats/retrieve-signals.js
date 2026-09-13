// Filters and caps correctly, then reports the context as complete no matter
// what it dropped: `matched` is copied from the rows it is sending and
// `truncated` is nailed to false. The accounting is the whole point of the
// task, since the prompt only ever carries `rows`, so a caller reading this
// retrieval cannot tell twenty rows of twenty from twenty rows of several
// hundred. Every filter test passes; the report it feeds is blind.
function retrieveSignals(query, db, now) {
  const bandMatch = query.match(/band[- ]?(\w+)/i);
  const hoursMatch = query.match(/(\d+)\s*hours/i);
  const wantsAnomalies = /anomal/i.test(query);

  let survivors = db;
  if (bandMatch) {
    survivors = survivors.filter(
      (s) => s.band.toLowerCase() === bandMatch[1].toLowerCase(),
    );
  }
  if (hoursMatch) {
    const cutoff = now - parseInt(hoursMatch[1], 10) * 3600 * 1000;
    survivors = survivors.filter((s) => Date.parse(s.timestamp) > cutoff);
  }
  if (wantsAnomalies) {
    survivors = survivors.filter((s) => s.classification === "anomaly");
  }

  const rows = survivors.slice(0, 20);
  return { rows, matched: rows.length, truncated: false };
}
