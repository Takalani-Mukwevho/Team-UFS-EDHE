export const fmt = (n) => 'R' + Math.round(n).toLocaleString('en-US')

export const fmt2 = (n) =>
  'R' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const pillClass = (band) =>
  band === 'Low' ? 'p-low' : band === 'Medium' ? 'p-med' : 'p-high'
