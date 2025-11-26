import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TradingChart from "../components/TradingChart";
import OrderBook from "../components/OrderBook";
import DepthChart from "../components/DepthChart";
import TradeForm from "../components/TradeForm";

export default function CoinDetails(){
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let cancelled = false;
    async function load(){
      try{
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
        const data = await res.json();
        if(!cancelled){
          setCoin(data);
          setPrice(data.market_data.current_price.usd);
          setLoading(false);
        }
      }catch(e){
        console.error(e);
        setLoading(false);
      }
    }
    load();

    // live trade stream: try pair id + usdt
    const pair = `${id}usdt`.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@trade`);
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if(d && d.p) setPrice(parseFloat(d.p));
      } catch (e){}
    };
    ws.onerror = ()=>{};
    return ()=>{ cancelled=true; ws.close(); };
  },[id]);

  if(loading) return <div className="card"><div className="sub">Loading coin…</div></div>;
  if(!coin) return <div className="card"><div className="sub">Coin not found</div></div>;

  return (
    <div>
      <div className="card" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <img src={coin.image.large} alt="" style={{width:64,height:64,borderRadius:12}}/>
          <div>
            <div style={{fontSize:20,fontWeight:800}}>{coin.name} <span className="small">({coin.symbol.toUpperCase()})</span></div>
            <div className="small">Rank #{coin.market_cap_rank}</div>
          </div>
        </div>

        <div style={{textAlign:"right"}}>
          <div className="small">Price</div>
          <div style={{fontSize:26,fontWeight:800,color:"var(--accent)"}}>${price?.toLocaleString()}</div>
          <div className="small">24h: <span style={{color: coin.market_data.price_change_percentage_24h>=0 ? "var(--positive)" : "var(--negative)"}}>{coin.market_data.price_change_percentage_24h?.toFixed(2)}%</span></div>
        </div>
      </div>

      <div className="grid-2" style={{marginTop:16}}>
        <div>
          <div className="card">
            <TradingChart coinId={id} />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <div className="card">
              <OrderBook pair={`${id}usdt`} />
            </div>
            <div className="card">
              <DepthChart />
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <TradeForm coin={coin} livePrice={price} />
          </div>

          <div className="card" style={{marginTop:12}}>
            <h3 style={{color:"var(--accent)"}}>Stats</h3>
            <div className="small" style={{marginTop:8}}>
              Market Cap: ${coin.market_data.market_cap.usd.toLocaleString()} <br/>
              Circulating: {coin.market_data.circulating_supply?.toLocaleString() || "—"} <br/>
              Total Supply: {coin.market_data.total_supply?.toLocaleString() || "—"}
            </div>
          </div>
        </div>
      </div>

      <div style={{marginTop:18}} className="card">
        <h3 style={{color:"var(--accent)"}}>About</h3>
        <div style={{color:"var(--muted)",marginTop:8}} dangerouslySetInnerHTML={{__html: coin.description.en ? coin.description.en.split(". ").slice(0,6).join(". ") + "." : "No description."}} />
        <div style={{marginTop:8}}>
          <a href={coin.links.homepage[0]} target="_blank" rel="noreferrer" style={{color:"cyan"}}>Official site</a>
        </div>
      </div>
    </div>
  );
}
