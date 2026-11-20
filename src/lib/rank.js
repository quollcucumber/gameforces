// Codeforces ranks: name colour class and the rating-graph band colour.
export const RANKS = [
  { min: -Infinity, title: 'Newbie', cls: 'gray', band: '#CCCCCC' },
  { min: 1200, title: 'Pupil', cls: 'green', band: '#77FF77' },
  { min: 1400, title: 'Specialist', cls: 'cyan', band: '#77DDBB' },
  { min: 1600, title: 'Expert', cls: 'blue', band: '#AAAAFF' },
  { min: 1900, title: 'Candidate Master', cls: 'violet', band: '#FF88FF' },
  { min: 2100, title: 'Master', cls: 'orange', band: '#FFCC88' },
  { min: 2300, title: 'International Master', cls: 'orange', band: '#FFBB55' },
  { min: 2400, title: 'Grandmaster', cls: 'red', band: '#FF7777' },
  { min: 2600, title: 'International Grandmaster', cls: 'red', band: '#FF3333' },
  { min: 3000, title: 'Legendary Grandmaster', cls: 'red legendary', band: '#AA0000' },
]
export const rankOf = (r) => RANKS.findLast((x) => r >= x.min)
