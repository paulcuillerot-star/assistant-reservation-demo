(function(){
  const state = { open:false };

  function el(tag, attrs={}, children=[]) {
    const node = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.substring(2), v);
      else node.setAttribute(k, v);
    }
    (children || []).forEach(c => node.append(c));
    return node;
  }

  function scrollToBottom() {
    const m = document.querySelector('.n8n-messages');
    if (m) m.scrollTop = m.scrollHeight;
  }

  function addBubble(msg, who='bot') {
    const container = document.querySelector('.n8n-messages');
    if (!container) return;
    const bubble = el('div', { class:`n8n-bubble ${who}` }, [msg]);
    container.append(bubble);
    scrollToBottom();
  }

  function toggle() {
    state.open = !state.open;
    document.getElementById('n8n-chat-widget').classList.toggle('open', state.open);
    document.getElementById('n8n-chat-launcher').style.display = state.open ? 'none' : 'grid';
  }

  function send() {
    const input = document.getElementById('n8n-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble(text, 'user');
    respond(text);
  }

  function respond(text) {
    const lower = text.toLowerCase();
    let reply = "Je n’ai pas bien compris, pouvez-vous reformuler ?";
    if (lower.includes('bonjour')) reply = "Bonjour 👋 Comment puis-je vous aider ?";
    else if (lower.includes('réserver') || lower.includes('dispo')) reply = "Je peux vous proposer un créneau à 19h demain, cela vous convient ?";
    else if (lower.includes('merci')) reply = "Avec plaisir 😊";
    else if (lower.includes('au revoir')) reply = "Au revoir 👋 Passez une excellente journée !";
    setTimeout(() => addBubble(reply, 'bot'), 500);
  }

  window.N8NChatWidget = {
    init(cfg={}) {
      const root = document.getElementById('n8n-chat-root') || document.body;
      const launcher = el('button', { id:'n8n-chat-launcher', onclick: toggle }, ['💬']);
      const widget = el('div', { id:'n8n-chat-widget' });
      const header = el('div', { class:'n8n-header' }, [
        el('div', {}, [el('h3', {}, [cfg.headerTitle || 'Assistant']), el('div',{class:'status'},['En ligne'])]),
        el('button', { class:'n8n-close', onclick: toggle }, ['×'])
      ]);
      const messages = el('div', { class:'n8n-messages' });
      const inputZone = el('div', { class:'n8n-input' }, [
        el('input', { id:'n8n-input', placeholder:'Écrivez ici...', onkeydown:e=>{if(e.key==='Enter')send();} }),
        el('button', { onclick: send }, ['Envoyer'])
      ]);
      widget.append(header, messages, inputZone);
      root.append(launcher, widget);
      addBubble(cfg.welcome || "Bonjour 👋 Posez-moi votre question !");
    }
  };
})();
