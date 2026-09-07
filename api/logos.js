const normalize = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export default async function handler(req,res){
  try{
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    const [channelsResp,logosResp] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json'),
      fetch('https://iptv-org.github.io/api/logos.json')
    ]);
    if(!channelsResp.ok || !logosResp.ok) throw new Error('Source logos indisponible');
    const [channels,logos] = await Promise.all([channelsResp.json(),logosResp.json()]);

    const logosByChannel = new Map();
    for(const l of logos){
      if(!l.channel || !l.url) continue;
      const score = (l.in_use?1000:0) + (l.tags?.includes('horizontal')?100:0) + (l.format==='SVG'?20:0) + Math.min(l.width||0,2000)/1000;
      const prev=logosByChannel.get(l.channel);
      if(!prev || score>prev.score) logosByChannel.set(l.channel,{url:l.url,score});
    }

    const nameMap = new Map();
    for(const ch of channels){
      const logo=logosByChannel.get(ch.id)?.url;
      if(!logo) continue;
      const names=[ch.name,...(ch.alt_names||[])];
      for(const name of names){
        const key=normalize(name);
        if(key && !nameMap.has(key)) nameMap.set(key,logo);
      }
    }

    const out=Object.fromEntries(nameMap);
    res.status(200).json(out);
  }catch(e){
    res.status(500).json({error:e.message});
  }
}
