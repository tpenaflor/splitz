const t1 = 1783273311; // Clark end
const t2 = 1783271396; // Ty end
const s1 = 1783257215; // Clark start

console.log("Clark end (PST):", new Date(t1 * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit', second: '2-digit' }));
console.log("Ty end (PST):", new Date(t2 * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit', second: '2-digit' }));
console.log("Clark start (PST):", new Date(s1 * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit', second: '2-digit' }));
