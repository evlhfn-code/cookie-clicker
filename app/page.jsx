"use client";

import { useEffect, useMemo, useState } from "react";

const BUILDINGS = [
  { id:"cursor", name:"Cursor", base:15, cps:0.1, icon:"👆" },
  { id:"grandma", name:"Grandma", base:100, cps:1, icon:"👵" },
  { id:"farm", name:"Farm", base:1100, cps:8, icon:"🌾" },
  { id:"mine", name:"Mine", base:12000, cps:47, icon:"⛏️" },
  { id:"factory", name:"Factory", base:130000, cps:260, icon:"🏭" },
  { id:"bank", name:"Bank", base:1400000, cps:1400, icon:"🏦" },
  { id:"temple", name:"Temple", base:20000000, cps:7800, icon:"🏛️" },
  { id:"wizard", name:"Wizard Tower", base:330000000, cps:44000, icon:"🧙" },
  { id:"shipment", name:"Shipment", base:5100000000, cps:260000, icon:"🚀" },
  { id:"alchemy", name:"Alchemy Lab", base:75000000000, cps:1600000, icon:"⚗️" }
];

const UPGRADES = [
  { id:"finger", name:"Reinforced Finger", desc:"+1 cookie per click", cost:100, kind:"click", value:1 },
  { id:"gloves", name:"Baking Gloves", desc:"+5 cookies per click", cost:1000, kind:"click", value:5 },
  { id:"oven", name:"Better Oven", desc:"+25% cookie production", cost:5000, kind:"mult", value:0.25 },
  { id:"turbo", name:"Turbo Mixers", desc:"+100% cookie production", cost:50000, kind:"mult", value:1 }
];

const ACHIEVEMENTS = [
  ["first","First Batch","Bake 1 cookie.",1],
  ["hundred","Cookie Century","Bake 100 cookies.",100],
  ["thousand","Cookie Hoarder","Bake 1,000 cookies.",1000],
  ["million","Millionaire","Bake 1,000,000 cookies.",1000000],
  ["tenmillion","Cookie Tycoon","Bake 10,000,000 cookies.",10000000]
];

function fmt(n) {
  if (n < 1000) return Math.floor(n).toLocaleString();
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No"];
  let i = -1, value = n;
  while (value >= 1000 && i < units.length - 1) { value /= 1000; i++; }
  return (value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)) + units[i];
}

export default function Home() {
  const [cookies,setCookies] = useState(0);
  const [total,setTotal] = useState(0);
  const [buildings,setBuildings] = useState({});
  const [clickPower,setClickPower] = useState(1);
  const [multiplier,setMultiplier] = useState(1);
  const [purchased,setPurchased] = useState([]);
  const [pops,setPops] = useState([]);
  const [golden,setGolden] = useState(null);
  const [buff,setBuff] = useState(null);
  const [loaded,setLoaded] = useState(false);

  const baseCps = useMemo(
    () => BUILDINGS.reduce((sum,b) => sum + (buildings[b.id] || 0) * b.cps, 0),
    [buildings]
  );
  const cps = baseCps * multiplier * (buff?.kind === "frenzy" ? 7 : 1);
  const buildingCount = Object.values(buildings).reduce((sum,n) => sum + n, 0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cookie-clicker-save"));
      if (saved) {
        setCookies(saved.cookies || 0);
        setTotal(saved.total || 0);
        setBuildings(saved.buildings || {});
        setClickPower(saved.clickPower || 1);
        setMultiplier(saved.multiplier || 1);
        setPurchased(saved.purchased || []);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      const amount = cps / 10;
      setCookies(v => v + amount);
      setTotal(v => v + amount);
    }, 100);
    return () => clearInterval(timer);
  }, [cps,loaded]);

  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      localStorage.setItem("cookie-clicker-save", JSON.stringify({
        cookies,total,buildings,clickPower,multiplier,purchased
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, [cookies,total,buildings,clickPower,multiplier,purchased,loaded]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!golden && Math.random() < 0.025) {
        setGolden({ x:8 + Math.random()*84, y:15 + Math.random()*65 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [golden]);

  function bake(e) {
    const amount = clickPower * (buff?.kind === "click" ? 7 : 1);
    const rect = e.currentTarget.getBoundingClientRect();
    const pop = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      amount
    };
    setPops(v => [...v,pop]);
    setCookies(v => v + amount);
    setTotal(v => v + amount);
    setTimeout(() => setPops(v => v.filter(p => p.id !== pop.id)), 700);
  }

  function buyBuilding(b) {
    const owned = buildings[b.id] || 0;
    const cost = Math.floor(b.base * Math.pow(1.15, owned));
    if (cookies < cost) return;
    setCookies(v => v - cost);
    setBuildings(v => ({...v,[b.id]:owned+1}));
  }

  function buyUpgrade(u) {
    if (purchased.includes(u.id) || cookies < u.cost) return;
    setCookies(v => v - u.cost);
    setPurchased(v => [...v,u.id]);
    if (u.kind === "click") setClickPower(v => v + u.value);
    if (u.kind === "mult") setMultiplier(v => v * (1 + u.value));
  }

  function clickGolden() {
    setGolden(null);
    setCookies(v => v + 777);
    setTotal(v => v + 777);
    const kind = Math.random() < 0.35 ? "click" : "frenzy";
    setBuff({kind});
    setTimeout(() => setBuff(null),15000);
  }

  function reset() {
    if (!confirm("Reset your cookie empire?")) return;
    localStorage.removeItem("cookie-clicker-save");
    setCookies(0); setTotal(0); setBuildings({});
    setClickPower(1); setMultiplier(1); setPurchased([]);
    setBuff(null);
  }

  return (
    <main className="game">
      <header>
        <div>
          <h1>COOKIE<span>CLICKER</span></h1>
          <small>Bake. Upgrade. Repeat.</small>
        </div>
        <div className="stats">
          <b>{fmt(cookies)}<small>cookies</small></b>
          <b>{fmt(cps)}<small>per second</small></b>
        </div>
      </header>

      <section className="layout">
        <div className="main">
          <div className="stage">
            <label>COOKIES BAKED: {fmt(total)}</label>
            <button className="cookieBtn" onClick={bake} aria-label="Bake cookie">🍪</button>
            {pops.map(p => <i key={p.id} style={{left:p.x,top:p.y}}>+{fmt(p.amount)}</i>)}
            {golden && (
              <button
                className="golden"
                style={{left:golden.x+"%",top:golden.y+"%"}}
                onClick={clickGolden}
                aria-label="Golden cookie"
              >✨</button>
            )}
            {buff && <strong className="frenzy">
              {buff.kind === "frenzy" ? "7× COOKIE FRENZY!" : "7× CLICK FRENZY!"}
            </strong>}
          </div>
          <p className="power">+{fmt(clickPower)} per click • ×{multiplier.toFixed(2)} production</p>
          <div className="actions"><button onClick={reset}>Reset Save</button></div>
        </div>

        <aside className="shop">
          <h2>BUILDINGS</h2>
          {BUILDINGS.map(b => {
            const owned = buildings[b.id] || 0;
            const cost = Math.floor(b.base * Math.pow(1.15,owned));
            const affordable = cookies >= cost;
            return (
              <button className={"building " + (affordable ? "ok" : "")} key={b.id} onClick={() => buyBuilding(b)}>
                <span>{b.icon}</span>
                <div><b>{b.name}</b><small>{fmt(b.cps)} cookies/sec each</small></div>
                <div className="right"><b>{owned}</b><small>🍪 {fmt(cost)}</small></div>
              </button>
            );
          })}
        </aside>
      </section>

      <section className="bottom">
        <div className="panel">
          <h2>🧪 UPGRADES</h2>
          {UPGRADES.map(u => {
            const done = purchased.includes(u.id);
            return (
              <button className={"building " + (done ? "ok" : "")} disabled={done || cookies < u.cost} key={u.id} onClick={() => buyUpgrade(u)}>
                <span>{done ? "✅" : "⬆️"}</span>
                <div><b>{u.name}</b><small>{done ? "Purchased" : u.desc}</small></div>
                <div className="right"><small>{done ? "DONE" : "🍪 " + fmt(u.cost)}</small></div>
              </button>
            );
          })}
        </div>

        <div className="panel">
          <h2>🏆 ACHIEVEMENTS</h2>
          {ACHIEVEMENTS.map(a => {
            const unlocked = total >= a[3];
            return <div className={"achievement " + (unlocked ? "unlocked" : "")} key={a[0]}>
              <span>{unlocked ? "🏆" : "🔒"}</span>
              <div><b>{a[1]}</b><small>{a[2]}</small></div>
            </div>;
          })}
        </div>

        <div className="panel">
          <h2>📊 STATS</h2>
          <p>Total baked: <b>{fmt(total)}</b></p>
          <p>Buildings owned: <b>{buildingCount}</b></p>
          <p>Base production: <b>{fmt(baseCps)}/sec</b></p>
          <p>Current production: <b>{fmt(cps)}/sec</b></p>
          <p>Click power: <b>{fmt(clickPower)}</b></p>
          <p>Golden cookies trigger temporary buffs.</p>
        </div>
      </section>

      <footer>Original incremental-game implementation • Auto-saves locally</footer>
    </main>
  );
}
