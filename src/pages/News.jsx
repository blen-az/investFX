import React, { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard";

export default function News(){
  const [news, setNews] = useState([]);

  useEffect(()=>{
    let cancelled = false;
    async function load(){
      try{
        const res = await fetch("https://api.coingecko.com/api/v3/events");
        const d = await res.json();
        if(!cancelled) setNews(d.data?.slice(0,8) || []);
      }catch(e){
        console.error(e);
        setNews([]);
      }
    }
    load();
    return ()=> cancelled = true;
  },[]);

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="h1">News</h1>
          <div className="sub">Latest crypto events & headlines</div>
        </div>
      </div>

      <div className="news-grid">
        {news.length === 0 ? <div className="card">No news available</div> : news.map((n,i)=> <NewsCard key={i} item={n} />)}
      </div>
    </div>
  );
}
