/* Demo widget with built-in mock replies when webhookUrl is empty.
   Public API: window.N8NChatWidget.init({ webhookUrl, siteId, headerTitle, welcome, accent })
*/
(function(){
  const state = { cfg:null, sessionId:null, open:false, sending:false, typingEl:null };

  function uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  function ensureRoot(){ let r=document.getElementById('n8n-chat-root'); if(!r){ r=document.createElement('div'); r.id='n8n-chat-root'; document.body.appendChild(r);} return r; }
  function el(tag, attrs={}, children=[]){ const n=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') n.className=v; else if(k==='style') n.setAttribute('style',v); else n[k]=v;}); children.forEach(c=>n.appendChild(typeof c==='string'?document.createTextNode(c):c)); return n; }

  function render(cfg){
    const style = document.documentElement.style;
    if (cfg.accent) style.setProperty("--n8n-accent", cfg.accent);

    const root = ensureRoot();
    const launcher = el('button', { id:'n8n-chat-launcher', title:'Chat' }, [ '💬' ]);
    const widget = el('div', { id:'n8n-chat-widget' }, []);

    const header = el('div', { class:'n8n-header' }, [
      el('div', {}, [ el('h3', {}, [ cfg.headerTitle || 'Assistant' ]), el('div', { class:'status' }, [ 'En ligne' ]) ]),
      el('button', { class:'n8n-close', onclick: toggle }, [ '×' ])
    ]);

    const messages = el('div', { class:'n8n-messages', id:'n8n-messages' });
    const suggestions = el('div', { class:'n8n-suggestions', id:'n8n-suggestions' });
    const inputWrap = el('div', { class:'n8n-input' });
    const input = el('input', { placeholder:'Écrivez votre message…', id:'n8n-input' });
    const sendBtn = el('button', { onclick: () => sendMessage(cfg) }, [ 'Envoyer' ]);
    input.addEventListener('keydown', (e)=>{ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(cfg); } });
    inputWrap.append(input, sendBtn);

    widget.append(header, messages, suggestions, inputWrap);
    root.append(launcher, widget);
    launcher.addEventListener('click', toggle);

    state.sessionId = localStorage.getItem('n8n_chat_session') || uuid();
    localStorage.setItem('n8n_chat_session', state.sessionId);
    if (cfg.welcome) addBubble(cfg.welcome, 'bot');

    // demo suggestions
    setSuggestions([ "Voir les disponibilités", "Réserver pour 19h", "Parler à un humain" ]);
  }

  function toggle(){ state.open=!state.open; const w=document.getElementById('n8n-chat-widget'); const l=document.getElementById('n8n-chat-launcher'); if(!w||!l) return; w.classList.toggle('open', state.open); l.style.display=state.open?'none':'grid'; scrollToBottom(); document.getElementById('n8n-input')?.focus(); }
  function addBubble(text, who='bot'){ const m=document.getElementById('n8n-messages'); if(!m) return; const b=el('div',{class:'n8n-bubble '+who},[text]); m.appendChild(b); scrollToBottom(); }
  function setSuggestions(items){ const c=document.getElementById('n8n-suggestions'); if(!c) return; c.innerHTML=''; (items||[]).slice(0,6).forEach(s=>{ const chip=el('div',{class:'n8n-chip',onclick:()=>{ addBubble(s,'user'); handleMessage(s);} },[s]); c.appendChild(chip); }); }
  function showTyping(){ const m=document.getElementById('n8n-messages'); state.typingEl=el('div',{class:'n8n-typing'},[el('span'),el('span'),el('span')]); m.appendChild(state.typingEl); scrollToBottom(); }
  function hideTyping(){ if(state.typingEl&&state.typingEl.parentNode){ state.typingEl.parentNode.removeChild(state.typingEl);} state.typingEl=null; }
  function scrollToBottom(){ const m=document.getElementById('n8n-messages'); if(!m) return; m.scrollTop=m.scrollHeight; }

  async function sendMessage(cfg){
    const input=document.getElementById('n8n-input'); const text=(input?.value||'').trim(); if(!text) return;
    addBubble(text,'user'); input.value='';
    if (!cfg.webhookUrl){ return mockReply(text); } // demo mode
    await post({ message:text }, cfg);
  }

  function handleMessage(text){ addBubble(text,'user'); mockReply(text); }

  function mockReply(text){
    showTyping();
    setTimeout(()=>{
      hideTyping();
      const t = text.toLowerCase();
      let reply = "Bonjour ! Ceci est une démo. Je peux proposer des créneaux, répondre aux questions et confirmer une réservation.";
      let suggestions = ["Réserver pour 19h", "Voir les disponibilités", "Modifier une réservation"];
      if (t.includes("19h") || t.includes("19:00")){
        reply = "Parfait, 19h est disponible. Souhaitez-vous confirmer la réservation ?";
        suggestions = ["Confirmer", "Autre horaire", "Annuler"];
      } else if (t.includes("demain") || t.includes("today") || t.includes("aujourd")){
        reply = "Pour demain, j’ai 12:30, 19:00 et 20:00. Lequel vous convient ?";
        suggestions = ["12:30", "19:00", "20:00"];
      } else if (t.includes("humain")){
        reply = "Je peux transmettre votre demande à un conseiller. Laissez-moi un email ou un numéro.";
        suggestions = ["Envoyer mon email", "Envoyer mon numéro"];
      }
      addBubble(reply,'bot');
      setSuggestions(suggestions);
    }, 600);
  }

  async function post(payload, cfg){
    showTyping();
    try{
      const res = await fetch(cfg.webhookUrl, {
        method:'POST',
        headers:{ 'Content-Type':'application/json','X-Site-Id': cfg.siteId || '' },
        body: JSON.stringify({ sessionId: state.sessionId, site_id: cfg.siteId, ...payload })
      });
      const data = await res.json();
      hideTyping();
      if (data && typeof data.reply === 'string') addBubble(data.reply, 'bot');
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
      if (data.error) addBubble('⚠️ ' + data.error, 'bot');
    } catch(e){
      hideTyping();
      addBubble('Désolé, service indisponible (démo).', 'bot');
      console.error(e);
    }
  }

  window.N8NChatWidget = { init(cfg){ state.cfg=cfg||{}; render(state.cfg);} };
})();
