import React, { useEffect, useState } from "react";

export default function Profile(){
  const [name, setName] = useState(localStorage.getItem("user_name_v2") || "");
  const [email, setEmail] = useState(localStorage.getItem("user_email_v2") || "");
  const [balance, setBalance] = useState(()=> Number(localStorage.getItem("demo_balance_v2") || 10000));

  useEffect(()=> localStorage.setItem("user_name_v2", name), [name]);
  useEffect(()=> localStorage.setItem("user_email_v2", email), [email]);
  useEffect(()=> localStorage.setItem("demo_balance_v2", String(balance)), [balance]);

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="h1">Profile</h1>
          <div className="sub">Account & demo settings</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:18}}>
        <div className="card">
          <h3 style={{color:"var(--accent)"}}>Personal</h3>
          <div style={{marginTop:10}}>
            <div className="small">Full name</div>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="input" />
            <div className="small" style={{marginTop:10}}>Email</div>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="input" />
          </div>
        </div>

        <div className="card">
          <h3 style={{color:"var(--accent)"}}>Demo Balance</h3>
          <div style={{fontSize:22,fontWeight:800,marginTop:8}}>${balance.toFixed(2)}</div>
          <div style={{marginTop:10}}>
            <button className="btn" onClick={()=>setBalance(b=>b+1000)} style={{background:"var(--accent)",color:"#000"}}>Add $1000</button>
            <button className="btn" onClick={()=>{ if(window.confirm("Reset demo balance?")) setBalance(10000) }} style={{marginLeft:8}}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
