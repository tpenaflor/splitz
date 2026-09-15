const activities = [
  { startTime: 1783257215, endTime: 1783273311, positions: [{time: 1783257215, lat: 0, lon: 0}, {time: 1783273311, lat: 0, lon: 0}] },
  { startTime: 1783258370, endTime: 1783271396, positions: [{time: 1783258370, lat: 1, lon: 1}, {time: 1783271396, lat: 1, lon: 1}] }
];

function computePrivacyBounds(activities, privacyMode) {
  if (activities.length === 0) return { minTime: null, maxTime: null };
  const allStartTimes = activities.map(a => a.startTime);
  const allEndTimes = activities.map(a => a.endTime);
  
  const minTime = Math.min(...allStartTimes);
  const maxTime = Math.max(...allEndTimes);
  
  return { minTime, maxTime };
}
console.log(computePrivacyBounds(activities, false));
