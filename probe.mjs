const BASE="https://tensorcraft.app", API="https://api.tensorcraft.app";
async function head(url){try{const r=await fetch(url,{redirect:"follow"});return `${r.status}`;}catch(e){return "ERR:"+e.message.slice(0,40);}}
async function noredir(url){try{const r=await fetch(url,{redirect:"manual"});return `${r.status}${r.headers.get("location")?" → "+r.headers.get("location"):""}`;}catch(e){return "ERR:"+e.message.slice(0,40);}}
const pub=["/","/pricing","/themes","/themes/deep-orbit","/learn","/about","/compare","/glossary","/terms","/privacy","/auth","/sitemap.xml","/robots.txt","/faq","/blog"];
const cs=["/themes/neon-protocol","/themes/neon-protocol/foundations/01-welcome","/themes/neon-protocol/capstone"];
const prot=["/dashboard","/settings","/onboarding","/admin","/inbox"];
console.log("=== PUBLIC (follow) ===");
for(const p of pub) console.log(`  ${p.padEnd(26)} ${await head(BASE+p)}`);
console.log("=== COMING-SOON (lesson/capstone must 404) ===");
for(const p of cs) console.log(`  ${p.padEnd(46)} ${await head(BASE+p)}`);
console.log("=== PROTECTED unauth (no-redirect) ===");
for(const p of prot) console.log(`  ${p.padEnd(14)} ${await noredir(BASE+p)}`);
console.log("=== API ===");
console.log("  health        "+await head(API+"/api/health"));
console.log("  og deep-orbit "+await head(API ? BASE+"/api/og?title=Test&theme=deep-orbit&subtitle=x":""));
