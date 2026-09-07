const normalize = (s='') => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const hardcoded = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

export default async function handler(req,res){
  try{
    const [channelsResp,logosResp] = await Promise.all([
      fetch('https://chainetv.vercel.app/api/channels'),
      fetch('https://chainetv.vercel.app/api/logos')
    ]);
    if(!channelsResp.ok || !logosResp.ok) throw new Error('Impossible de charger les sources');
    const [channels,logos] = await Promise.all([channelsResp.json(),logosResp.json()]);
    const missing=[];
    let withLogo=0;
    for(const ch of channels){
      const ok = hardcoded.has(Number(ch.numero)) || Boolean(logos[normalize(ch.nom)]);
      if(ok) withLogo++;
      else missing.push({numero:ch.numero,nom:ch.nom,univers:ch.univers});
    }
    res.status(200).json({total:channels.length,withLogo,missingCount:missing.length,coverage:Math.round(withLogo/channels.length*1000)/10,missing});
  }catch(e){res.status(500).json({error:e.message});}
}
