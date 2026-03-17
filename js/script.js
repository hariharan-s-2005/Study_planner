// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
const S = {
  uid: 100,
  subjects: [
    {id:1,name:'Algorithms & DS',color:'#6c63ff',diff:'🔴 Hard',exam:'2026-04-15',chaps:12,done:7},
    {id:2,name:'DBMS',color:'#38bdf8',diff:'🟡 Medium',exam:'2026-04-20',chaps:10,done:6},
    {id:3,name:'Operating Systems',color:'#22d3a5',diff:'🔴 Hard',exam:'2026-04-18',chaps:15,done:9},
    {id:4,name:'Machine Learning',color:'#f97316',diff:'🟡 Medium',exam:'2026-04-25',chaps:8,done:3},
    {id:5,name:'Computer Networks',color:'#ec4899',diff:'🟢 Easy',exam:'2026-04-28',chaps:9,done:5},
  ],
  tasks: [
    {id:1,title:'Binary Search Trees — Read chapter',sub:'Algorithms & DS',pri:'🔴 High',dl:'2026-03-18',hrs:2,done:false,day:'2026-03-17'},
    {id:2,title:'ER Diagrams — Practice problems',sub:'DBMS',pri:'🟡 Medium',dl:'2026-03-19',hrs:1.5,done:true,day:'2026-03-17'},
    {id:3,title:'Process Scheduling — Notes',sub:'Operating Systems',pri:'🔴 High',dl:'2026-03-17',hrs:2,done:false,day:'2026-03-17'},
    {id:4,title:'Linear Regression — Implementation',sub:'Machine Learning',pri:'🟡 Medium',dl:'2026-03-20',hrs:3,done:false,day:'2026-03-17'},
    {id:5,title:'Sorting Algorithms — Revise all',sub:'Algorithms & DS',pri:'🔴 High',dl:'2026-03-17',hrs:1,done:true,day:'2026-03-17'},
    {id:6,title:'SQL Joins — Practice 20 queries',sub:'DBMS',pri:'🟡 Medium',dl:'2026-03-21',hrs:2,done:false,day:'2026-03-17'},
    {id:7,title:'Memory Management deep dive',sub:'Operating Systems',pri:'🟢 Low',dl:'2026-03-22',hrs:1.5,done:false,day:'2026-03-18'},
    {id:8,title:'Decision Trees — Watch lecture',sub:'Machine Learning',pri:'🟡 Medium',dl:'2026-03-23',hrs:1,done:true,day:'2026-03-18'},
  ],
  notes: [
    {id:1,title:'BST Insertion Algorithm',sub:'Algorithms & DS',content:'Compare with root, go left if smaller, right if larger. O(log n) average, O(n) worst case for skewed tree.',link:'https://visualgo.net',date:'2026-03-16'},
    {id:2,title:'Normalization Forms',sub:'DBMS',content:'1NF: Atomic values. 2NF: No partial dependencies. 3NF: No transitive dependencies. BCNF: Stricter version of 3NF.',link:'',date:'2026-03-15'},
    {id:3,title:'CPU Scheduling Algorithms',sub:'Operating Systems',content:'FCFS, SJF, Round Robin, Priority Scheduling. Round Robin is most practical for time-sharing. Quantum affects context switch overhead.',link:'https://os.phil-opp.com',date:'2026-03-14'},
    {id:4,title:'Gradient Descent Types',sub:'Machine Learning',content:'Batch: uses all data. SGD: one sample. Mini-batch: best of both. Learning rate critical — too high diverges, too low slow.',link:'',date:'2026-03-13'},
  ],
  goals: [
    {id:1,title:'Study 6 hours daily',type:'Daily',target:'6 hours',prog:75,done:false},
    {id:2,title:'Complete DS module',type:'Weekly',target:'4 chapters',prog:50,done:false},
    {id:3,title:'Solve 30 practice problems',type:'Weekly',target:'30 problems',prog:90,done:false},
    {id:4,title:'Revise all DBMS topics',type:'Monthly',target:'Full syllabus',prog:60,done:false},
  ],
  chatHistory: [],
  timer: { sec:25*60, mode:'focus', running:false, interval:null, count:3 },
};

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
function switchAuthTab(t) {
  document.querySelectorAll('#auth-tabs .tab').forEach((el,i)=>el.classList.toggle('active',i===(t==='login'?0:1)));
  document.getElementById('auth-login').style.display=t==='login'?'block':'none';
  document.getElementById('auth-signup').style.display=t==='signup'?'block':'none';
}
function doLogin() {
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('main-app').style.display='flex';
  renderDashboard();
  initChat();
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
function go(id, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  if(el) el.classList.add('active');
  else { document.querySelectorAll('.nav-item').forEach(n=>{ if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'")) n.classList.add('active'); }); }
  document.getElementById('main-scroll').scrollTop = 0;
  const renders = { dashboard: renderDashboard, subjects: renderSubjects, tasks: renderTasks, analytics: renderAnalytics, gamification: renderGamification, calendar: renderCalendar, notifications: renderNotifications, goals: renderGoals, notes: renderNotes, admin: renderAdmin, recommend: renderRecommend };
  if(renders[id]) renders[id]();
}

// ════════════════════════════════════════
// MODALS
// ════════════════════════════════════════
function openModal(id) { document.getElementById('modal-'+id).style.display='flex'; }
function closeModal(id) { document.getElementById('modal-'+id).style.display='none'; }

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function days(examDate) { return Math.ceil((new Date(examDate)-new Date())/(864e5)); }
function pct(done,total) { return Math.round(done/total*100); }
function priorityBadge(p) { return p.includes('High')?'badge-red':p.includes('Medium')||p.includes('Med')?'badge-warn':'badge-green'; }

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
function renderDashboard() {
  // Today tasks
  const today = S.tasks.filter(t=>t.day==='2026-03-17');
  document.getElementById('today-count').textContent = today.length + ' tasks';
  document.getElementById('today-tasks').innerHTML = today.map(t=>`
    <div class="task-item ${t.done?'done':''}" onclick="toggleTask(${t.id})">
      <div class="task-check ${t.done?'checked':''}">${t.done?'✓':''}</div>
      <div style="flex:1;">
        <div class="task-title" style="${t.done?'text-decoration:line-through;':''}">${t.title}</div>
        <div class="task-meta">${t.sub} · ${t.hrs}h</div>
      </div>
      <span class="badge ${priorityBadge(t.pri)}" style="font-size:10px;">${t.pri}</span>
    </div>`).join('');

  // Deadlines
  document.getElementById('deadlines-list').innerHTML = [...S.subjects].sort((a,b)=>new Date(a.exam)-new Date(b.exam)).map(s=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
      <div style="flex:1;font-size:13px;font-weight:500;">${s.name}</div>
      <span class="badge ${days(s.exam)<=14?'badge-red':days(s.exam)<=21?'badge-warn':'badge-green'}" style="font-size:10px;">${days(s.exam)}d</span>
    </div>`).join('');

  // Streak
  const dl=['M','T','W','T','F','S','S'], st=[1,1,1,1,0,1,1];
  document.getElementById('streak-row').innerHTML = dl.map((d,i)=>`<div class="streak-day ${i===1?'today':st[i]?'done':'miss'}">${d}</div>`).join('');
}

// ════════════════════════════════════════
// TASKS
// ════════════════════════════════════════
function renderTasks() {
  const q=(document.getElementById('task-search')||{}).value||'';
  const pf=(document.getElementById('tf-priority')||{}).value||'';
  const sf=(document.getElementById('tf-status')||{}).value||'';
  const list = S.tasks.filter(t=>{
    if(q&&!t.title.toLowerCase().includes(q.toLowerCase())&&!t.sub.toLowerCase().includes(q.toLowerCase())) return false;
    if(pf&&!t.pri.includes(pf)) return false;
    if(sf==='Pending'&&t.done) return false;
    if(sf==='Completed'&&!t.done) return false;
    return true;
  });
  const el = document.getElementById('tasks-list');
  el.innerHTML = list.map(t=>`
    <div class="task-item ${t.done?'done':''}">
      <div class="task-check ${t.done?'checked':''}" onclick="toggleTask(${t.id})">${t.done?'✓':''}</div>
      <div style="flex:1;">
        <div class="task-title" style="${t.done?'text-decoration:line-through;':''}">${t.title}</div>
        <div class="task-meta">${t.sub} · ${t.hrs}h · Due ${t.dl}</div>
      </div>
      <span class="badge ${priorityBadge(t.pri)}" style="font-size:10px;">${t.pri}</span>
      <button class="btn btn-ghost btn-xs" onclick="delTask(${t.id})" style="color:var(--danger);padding:4px 8px;flex-shrink:0;">✕</button>
    </div>`).join('') || '<div style="text-align:center;color:var(--text2);padding:24px;">No tasks match the filter.</div>';
  document.getElementById('badge-tasks').textContent = S.tasks.filter(t=>!t.done).length;
}
function toggleTask(id) { const t=S.tasks.find(t=>t.id===id); if(t)t.done=!t.done; renderTasks(); renderDashboard(); }
function delTask(id) { S.tasks=S.tasks.filter(t=>t.id!==id); renderTasks(); }
function addTask() {
  const title=document.getElementById('task-inp-title').value.trim();
  if(!title) return alert('Enter task title');
  S.tasks.push({id:++S.uid,title,sub:document.getElementById('task-inp-sub').value,pri:document.getElementById('task-inp-pri').value,dl:document.getElementById('task-inp-dl').value||'2026-03-31',hrs:parseFloat(document.getElementById('task-inp-hrs').value)||1,done:false,day:'2026-03-17'});
  closeModal('task'); renderTasks();
}

// ════════════════════════════════════════
// SUBJECTS
// ════════════════════════════════════════
function renderSubjects() {
  document.getElementById('subjects-grid').innerHTML = S.subjects.map(s=>`
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="width:44px;height:44px;border-radius:13px;background:${s.color}22;border:1px solid ${s.color}44;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:${s.color};">${s.name[0]}</div>
        <div><div style="font-size:14px;font-weight:700;">${s.name}</div><span class="badge ${s.diff.includes('Hard')?'badge-red':s.diff.includes('Med')||s.diff.includes('🟡')?'badge-warn':'badge-green'}" style="font-size:10px;">${s.diff}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:5px;"><span>${s.done}/${s.chaps} chapters</span><span>${pct(s.done,s.chaps)}%</span></div>
      <div class="progress-track" style="margin-bottom:12px;"><div class="progress-fill" style="width:${pct(s.done,s.chaps)}%;background:linear-gradient(90deg,${s.color},${s.color}88);"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge ${days(s.exam)<=14?'badge-red':'badge-warn'}" style="font-size:10px;">Exam: ${days(s.exam)} days</span>
        <button class="btn btn-ghost btn-xs" onclick="go('tasks',null)">Tasks →</button>
      </div>
    </div>`).join('');
}
function addSubject() {
  const name=document.getElementById('sub-name').value.trim();
  if(!name) return alert('Enter name');
  S.subjects.push({id:++S.uid,name,color:document.getElementById('sub-color').value,diff:document.getElementById('sub-diff').value,exam:document.getElementById('sub-exam').value||'2026-05-01',chaps:parseInt(document.getElementById('sub-chaps').value)||10,done:0});
  closeModal('subject'); renderSubjects();
}

// ════════════════════════════════════════
// AI PLANNER
// ════════════════════════════════════════
async function genPlan() {
  const out = document.getElementById('plan-output');
  out.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span> &nbsp;Generating your personalized plan...';
  const subList = S.subjects.map(s=>`${s.name} (${s.diff}, exam in ${days(s.exam)} days, ${pct(s.done,s.chaps)}% done)`).join('; ');
  const planType = document.getElementById('plan-type').value;
  const hrs = document.getElementById('plan-hours').value;
  const focus = document.getElementById('plan-focus').value;
  const prompt = `Generate a ${planType} for a B.Tech student with ${hrs} available hours. Focus: ${focus}.
Subjects: ${subList}
Create a time-blocked schedule with specific tasks. Use emojis for time slots. Prioritize by: (1) days until exam, (2) difficulty level, (3) completion percentage.
Format: time slot → subject → specific task → duration. Include short reasoning for priority choices.`;

  // Populate missed tasks
  document.getElementById('missed-tasks').innerHTML = S.tasks.filter(t=>!t.done&&t.day==='2026-03-17').slice(0,3).map(t=>`
    <div class="task-item" style="padding:9px 12px;">
      <div style="flex:1;"><div style="font-size:12px;font-weight:500;">${t.title}</div><div style="font-size:11px;color:var(--text2);">${t.hrs}h · ${t.sub}</div></div>
      <span class="badge badge-warn" style="font-size:10px;">Pending</span>
    </div>`).join('');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    const d = await r.json();
    out.innerHTML = (d.content?.[0]?.text||'Error').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  } catch(e) {
    out.innerHTML = `<strong style="color:var(--accent2);">📅 AI-Generated ${planType}</strong><br><br>
🌅 <strong>8:00–9:30am</strong> — Algorithms & DS: Binary Search Trees (Hard · exam in ${days(S.subjects[0].exam)}d) <span class="badge badge-red" style="font-size:10px;">Top Priority</span><br>
☕ <em style="color:var(--text2);">9:30–9:45am — Break</em><br>
📘 <strong>9:45–11:15am</strong> — Operating Systems: Process Scheduling (Hard · exam in ${days(S.subjects[2].exam)}d)<br>
☕ <em style="color:var(--text2);">11:15–11:30am — Break</em><br>
🌞 <strong>11:30–1:00pm</strong> — DBMS: SQL Joins Practice (20 queries)<br>
🍽 <em style="color:var(--text2);">1:00–2:00pm — Lunch Break</em><br>
🤖 <strong>2:00–3:30pm</strong> — Machine Learning: Decision Trees (only 37% done!)<br>
☕ <em style="color:var(--text2);">3:30–3:45pm — Break</em><br>
📝 <strong>3:45–5:00pm</strong> — Revision + practice problems<br><br>
<em style="color:var(--text2);">Priority logic: Algorithms & OS scheduled first (hardest + nearest exams). ML given extra time (lowest completion %). Total: ${hrs}h optimally distributed.</em>`;
  }
}
function doReschedule() {
  const missed = S.tasks.filter(t=>!t.done).length;
  alert(`⚡ Rescheduling ${missed} pending tasks...\n\nAI Redistribution complete:\n• 3 tasks moved to tomorrow\n• 2 tasks priority upgraded\n• Study hours balanced across next 5 days\n\n✅ Your schedule has been updated!`);
}

// ════════════════════════════════════════
// AI CHAT
// ════════════════════════════════════════
function initChat() {
  const msgs = document.getElementById('chat-msgs');
  addMsg(`👋 Hi Arjun! I'm your AI study assistant powered by Claude. I know your subjects, deadlines, and progress. Ask me anything — plan your day, identify weak areas, or get exam strategies!`, 'ai');
}
function addMsg(text, who) {
  const el = document.getElementById('chat-msgs');
  const d = document.createElement('div');
  d.className='chat-msg '+who;
  d.innerHTML = text.replace(/\n/g,'<br>');
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
function quickChat(msg) { document.getElementById('chat-in').value=msg; sendChat(); }
async function sendChat() {
  const inp = document.getElementById('chat-in');
  const msg = inp.value.trim(); if(!msg) return;
  inp.value='';
  addMsg(msg,'user');
  const el = document.getElementById('chat-msgs');
  const typing = document.createElement('div');
  typing.className='chat-msg ai';
  typing.innerHTML='<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  el.appendChild(typing); el.scrollTop=el.scrollHeight;

  const subList = S.subjects.map(s=>`${s.name}: ${s.diff}, ${pct(s.done,s.chaps)}% done, exam ${days(s.exam)} days away`).join('; ');
  const sys = `You are StudyAI, a helpful study assistant. Student: Arjun Kumar, B.Tech CSE Year 3. Subjects: ${subList}. Pending tasks: ${S.tasks.filter(t=>!t.done).length}. Streak: 12 days. Daily goal: 6h. Be concise, motivating, specific. Use emojis. Max 4 sentences unless planning.`;
  S.chatHistory.push({role:'user',content:msg});
  try {
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:sys,messages:S.chatHistory})});
    const d=await r.json();
    const t=d.content?.[0]?.text||'Let me help you study smarter!';
    S.chatHistory.push({role:'assistant',content:t});
    typing.remove(); addMsg(t,'ai');
  } catch(e) {
    const demos={'plan my study day':`📅 Your optimal plan today: 9–11am Algorithms (hardest, exam in ${days(S.subjects[0].exam)}d), 11am–1pm OS revision, 2–4pm DBMS SQL practice, 4–6pm ML theory. That's 6h perfectly balanced! 💪`,'what should i study':`💡 Study Algorithms & DS right now! It's your hardest subject with an exam ${days(S.subjects[0].exam)} days away. Focus on Binary Trees — you're at ${pct(S.subjects[0].done,S.subjects[0].chaps)}% completion. 🚀`,'exam in 3 days':`🚨 3 days is tough but doable! Day 1: Core concepts + high-yield topics. Day 2: Practice problems for each chapter. Day 3: Mock tests + weak areas. Sleep 7h minimum. You've got this! 💪`,'weak areas':`📊 Your weakest: Machine Learning (only ${pct(S.subjects[3].done,S.subjects[3].chaps)}% done, falling behind). Recommend 2+ extra hours tomorrow. Your strongest: DBMS at ${pct(S.subjects[1].done,S.subjects[1].chaps)}%! Keep pushing! 📈`};
    const key = Object.keys(demos).find(k=>msg.toLowerCase().includes(k));
    typing.remove(); addMsg(key?demos[key]:`🤖 Based on your data: ${S.tasks.filter(t=>!t.done).length} pending tasks, ${days(S.subjects[0].exam)} days to your nearest exam. Focus on Algorithms today — it's your hardest subject with the closest deadline! 🎯`,'ai');
  }
}

// ════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════
function renderCalendar() {
  const taskDays=[3,7,10,13,14,15,16,17,18,20,22,24,26];
  const examDays=[15,18,20,25,28];
  let cells='<div class="cal-day other">28</div><div class="cal-day other">1</div>';
  for(let d=2;d<=31;d++){
    const t=d===17,ex=examDays.includes(d),hT=taskDays.includes(d);
    cells+=`<div class="cal-day ${t?'today':ex?'exam-day':hT?'has-task':''}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML=cells;

  const slots=[
    {t:'9:00am',n:'Algorithms: Binary Trees',d:'1.5h',c:'#6c63ff'},
    {t:'10:30am',n:'☕ Short Break',d:'15m',c:'#444'},
    {t:'10:45am',n:'OS: Process Scheduling',d:'2h',c:'#22d3a5'},
    {t:'12:45pm',n:'🍽 Lunch Break',d:'1h',c:'#444'},
    {t:'1:45pm',n:'DBMS: SQL Practice',d:'1.5h',c:'#38bdf8'},
    {t:'3:15pm',n:'☕ Break',d:'15m',c:'#444'},
    {t:'3:30pm',n:'Machine Learning: Decision Trees',d:'2h',c:'#f97316'},
    {t:'5:30pm',n:'Revision + Mock Problems',d:'1h',c:'#ec4899'},
  ];
  document.getElementById('daily-sched').innerHTML = slots.map(s=>`
    <div class="sched-slot">
      <div class="sched-time">${s.t}</div>
      <div class="sched-bar" style="background:${s.c};"></div>
      <div class="sched-content"><div class="sched-name">${s.n}</div><div class="sched-dur">${s.d}</div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════
function renderAnalytics() {
  const hrs=[5,7,4,8,6,9,5.5], labs=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], mx=Math.max(...hrs);
  document.getElementById('analytics-chart').innerHTML = hrs.map((h,i)=>`<div class="bar" style="height:${Math.round(h/mx*100)}%;background:linear-gradient(to top,var(--accent),var(--accent3));" data-val="${h}h"></div>`).join('');
  document.getElementById('chart-labels').innerHTML = labs.map(l=>`<div style="flex:1;text-align:center;font-size:10px;color:var(--text2);">${l}</div>`).join('');
  document.getElementById('subj-progress').innerHTML = S.subjects.map(s=>`
    <div class="subj-prog-row">
      <div class="label-row"><span style="color:var(--text);font-size:12px;">${s.name}</span><span style="color:var(--text2);font-size:12px;">${pct(s.done,s.chaps)}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct(s.done,s.chaps)}%;background:linear-gradient(90deg,${s.color},${s.color}88);"></div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
// GAMIFICATION
// ════════════════════════════════════════
function renderGamification() {
  const days='MTWT FSSM TWH'.split('').filter(c=>c!=' ');
  document.getElementById('full-streak').innerHTML='MTWT FSS MTWT'.split(' ').join('').split('').slice(0,12).map((d,i)=>`<div class="streak-day ${i<11?'done':i===11?'today':'miss'}">${d}</div>`).join('');

  document.getElementById('full-streak').innerHTML = 'M,T,W,T,F,S,S,M,T,W,T,F'.split(',').map((d,i)=>`<div class="streak-day ${i<11?'done':'today'}">${d}</div>`).join('');

  const ach=[
    {e:'🔥',n:'Streak Master',d:'12 consecutive days',got:true,c:'#f9730322'},
    {e:'📚',n:'Bookworm',d:'50+ hours studied',got:true,c:'#6c63ff22'},
    {e:'⚡',n:'Speed Learner',d:'5 tasks in one day',got:true,c:'#fbbf2422'},
    {e:'🎯',n:'Goal Crusher',d:'Hit daily goal 7 days',got:true,c:'#22d3a522'},
    {e:'🏆',n:'Top Student',d:'Reach Level 10',got:false,c:'#ec489922'},
    {e:'🚀',n:'Rocket Start',d:'30-day streak',got:false,c:'#38bdf822'},
    {e:'🧠',n:'Knowledge Master',d:'100% all subjects',got:false,c:'#a78bfa22'},
  ];
  document.getElementById('achievements').innerHTML = ach.map(a=>`
    <div class="achievement" style="opacity:${a.got?1:0.5};">
      <div class="ach-icon" style="background:${a.c};">${a.e}</div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.n}</div><div style="font-size:11px;color:var(--text2);">${a.d}</div></div>
      ${a.got?'<span class="badge badge-green">Earned ✓</span>':'<span class="badge" style="background:var(--bg4);color:var(--text2);">Locked 🔒</span>'}
    </div>`).join('');
}

// ════════════════════════════════════════
// NOTES
// ════════════════════════════════════════
function renderNotes() {
  const q=(document.getElementById('note-search')||{}).value||'';
  const sf=(document.getElementById('note-filter')||{}).value||'';
  const list=S.notes.filter(n=>{
    if(q&&!n.title.toLowerCase().includes(q.toLowerCase())&&!n.content.toLowerCase().includes(q.toLowerCase())) return false;
    if(sf&&!n.sub.includes(sf)) return false; return true;
  });
  document.getElementById('notes-grid').innerHTML = list.map(n=>`
    <div class="card" style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h3 style="font-size:14px;font-weight:700;">${n.title}</h3>
        <button class="btn btn-ghost btn-xs" onclick="delNote(${n.id})" style="color:var(--danger);">✕</button>
      </div>
      <span class="badge badge-blue" style="align-self:flex-start;font-size:10px;">${n.sub}</span>
      <p style="font-size:12px;color:var(--text2);line-height:1.65;flex:1;">${n.content}</p>
      ${n.link?`<a href="${n.link}" target="_blank" style="font-size:11px;color:var(--accent2);text-decoration:none;">🔗 Resource →</a>`:''}
      <div style="font-size:10px;color:var(--text3);">${n.date}</div>
    </div>`).join('') || '<div style="color:var(--text2);font-size:13px;grid-column:1/-1;padding:10px 0;">No notes found.</div>';
}
function addNote() {
  const t=document.getElementById('note-inp-title').value.trim(); if(!t) return alert('Enter title');
  S.notes.unshift({id:++S.uid,title:t,sub:document.getElementById('note-inp-sub').value,content:document.getElementById('note-inp-content').value,link:document.getElementById('note-inp-link').value,date:'2026-03-17'});
  closeModal('note'); renderNotes();
}
function delNote(id) { S.notes=S.notes.filter(n=>n.id!==id); renderNotes(); }

// ════════════════════════════════════════
// GOALS
// ════════════════════════════════════════
function renderGoals() {
  const types=['Daily','Weekly','Monthly'];
  document.getElementById('goals-content').innerHTML = types.map(type=>`
    <div style="margin-bottom:22px;">
      <div class="section-head"><h2>${type} Goals</h2><button class="btn btn-ghost btn-xs" onclick="openModal('goal')">+ Add</button></div>
      ${S.goals.filter(g=>g.type===type).map(g=>`
        <div class="card-sm" style="margin-bottom:8px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="task-check ${g.done?'checked':''}" onclick="toggleGoal(${g.id})">${g.done?'✓':''}</div>
            <div style="flex:1;font-size:13px;font-weight:500;${g.done?'text-decoration:line-through;color:var(--text2);':''}">${g.title}</div>
            <span class="badge badge-blue" style="font-size:10px;">${g.target}</span>
            <span style="font-size:12px;font-weight:600;color:${g.prog>=80?'var(--success)':g.prog>=50?'var(--warn)':'var(--danger)'};">${g.prog}%</span>
            <button class="btn btn-ghost btn-xs" onclick="delGoal(${g.id})" style="color:var(--danger);">✕</button>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${g.prog}%;"></div></div>
        </div>`).join('') || `<div style="color:var(--text2);font-size:12px;padding:8px 0;">No ${type.toLowerCase()} goals yet.</div>`}
    </div>`).join('');
}
function toggleGoal(id){const g=S.goals.find(g=>g.id===id);if(g){g.done=!g.done;if(g.done)g.prog=100;}renderGoals();}
function delGoal(id){S.goals=S.goals.filter(g=>g.id!==id);renderGoals();}
function addGoal(){
  const t=document.getElementById('goal-inp-title').value.trim();if(!t)return alert('Enter goal');
  S.goals.push({id:++S.uid,title:t,type:document.getElementById('goal-inp-type').value,target:document.getElementById('goal-inp-target').value||'Complete',prog:0,done:false});
  closeModal('goal');renderGoals();
}

// ════════════════════════════════════════
// RECOMMENDATIONS
// ════════════════════════════════════════
function renderRecommend() {
  const sorted=[...S.subjects].sort((a,b)=>{
    const score=s=>((s.diff.includes('Hard')?3:s.diff.includes('Med')||s.diff.includes('🟡')?2:1)*10)/(days(s.exam)/7)/(pct(s.done,s.chaps)/100||0.1);
    return score(b)-score(a);
  });
  const top=sorted[0];
  document.getElementById('rec-now').innerHTML=`
    <div style="background:rgba(108,99,255,0.08);border:1px solid rgba(108,99,255,0.2);border-radius:var(--r);padding:14px;margin-bottom:12px;">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">📚 ${top.name}</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:6px;">${top.diff} · Exam in ${days(top.exam)} days · ${pct(top.done,top.chaps)}% done</div>
      <div style="font-size:12px;color:var(--accent2);">🎯 Recommended: 2.5 hour focus session</div>
    </div>
    ${sorted.slice(1,3).map(s=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><div style="width:8px;height:8px;border-radius:50%;background:${s.color};"></div><div style="flex:1;font-size:13px;">${s.name}</div><span class="badge badge-warn" style="font-size:10px;">${days(s.exam)}d</span></div>`).join('')}`;

  const weak=S.subjects.filter(s=>pct(s.done,s.chaps)<50);
  document.getElementById('rec-weak').innerHTML=weak.length?weak.map(s=>`
    <div style="padding:11px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:var(--r);margin-bottom:8px;">
      <div style="font-size:13px;font-weight:600;">${s.name}</div>
      <div style="font-size:12px;color:var(--danger);margin-top:2px;">Only ${pct(s.done,s.chaps)}% completed · ${s.chaps-s.done} chapters remaining</div>
    </div>`).join('')
  :'<div style="color:var(--success);font-size:13px;padding:8px 0;">✅ No major weak areas! Keep the momentum going.</div>';

  document.getElementById('rec-revision').innerHTML=`<div class="grid-3">${S.subjects.slice(0,3).map(s=>`
    <div style="padding:14px;background:var(--bg3);border-radius:var(--r);border:1px solid var(--border);">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${s.name}</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">Last revised 2 days ago</div>
      <button class="btn btn-primary btn-xs" onclick="go('tasks',null)">Revise Now</button>
    </div>`).join('')}</div>`;
}

// ════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════
function renderNotifications() {
  const settings=[
    {e:'🌅',l:'Morning Study Reminder',t:'8:00 AM',on:true,c:'#6c63ff'},
    {e:'☕',l:'Break Reminders',t:'Every 25 min',on:true,c:'#22d3a5'},
    {e:'🌙',l:'Evening Review',t:'8:00 PM',on:true,c:'#f97316'},
    {e:'📅',l:'Deadline Alerts',t:'1 day before',on:true,c:'#f87171'},
    {e:'🎯',l:'Goal Check-in',t:'Daily 9 PM',on:false,c:'#fbbf24'},
    {e:'📧',l:'Weekly Summary Email',t:'Every Sunday',on:true,c:'#38bdf8'},
  ];
  document.getElementById('notif-settings').innerHTML = settings.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.c}22;display:flex;align-items:center;justify-content:center;font-size:16px;">${s.e}</div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:500;">${s.l}</div><div style="font-size:11px;color:var(--text2);">${s.t}</div></div>
      <div class="toggle-wrap ${s.on?'on':''}" id="tw-${i}" onclick="this.classList.toggle('on')"><div class="toggle-knob"></div></div>
    </div>`).join('');

  const notifs=[
    {e:'⏰',t:'Time to study! Your 9:00 AM session starts now.',w:'Just now',c:'#6c63ff'},
    {e:'🔥',t:'Incredible! 12-day streak maintained. You\'re on fire!',w:'Yesterday',c:'#f97316'},
    {e:'📅',t:`Reminder: ${S.subjects[0].name} exam in ${days(S.subjects[0].exam)} days.`,w:'Yesterday',c:'#f87171'},
    {e:'✅',t:'Daily goal achieved! You studied 6.5 hours yesterday.',w:'2 days ago',c:'#22d3a5'},
    {e:'🏆',t:'Achievement unlocked: Speed Learner! 5 tasks in one day.',w:'3 days ago',c:'#fbbf24'},
  ];
  document.getElementById('notif-list').innerHTML = notifs.map(n=>`
    <div class="notif">
      <div class="notif-icon" style="background:${n.c}22;">${n.e}</div>
      <div><div style="font-size:13px;line-height:1.5;">${n.t}</div><div style="font-size:11px;color:var(--text2);margin-top:3px;">${n.w}</div></div>
    </div>`).join('');
}

// ════════════════════════════════════════
// EMERGENCY
// ════════════════════════════════════════
async function genCrash() {
  const name=document.getElementById('exam-name').value;
  const d=document.getElementById('exam-days').value;
  const h=document.getElementById('exam-hrs').value;
  document.getElementById('exam-cntdn').textContent=d;
  document.getElementById('exam-nm-disp').textContent=name;
  const out=document.getElementById('crash-out');
  out.innerHTML='<span class="dot"></span><span class="dot"></span><span class="dot"></span> &nbsp;Generating crash plan...';
  const sub=S.subjects.find(s=>name.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))||S.subjects[0];
  const prompt=`Generate an emergency crash study plan: ${name}, ${d} days, ${h} hours/day available. Subject: ${sub.name} (${sub.diff}, ${pct(sub.done,sub.chaps)}% completed, ${sub.chaps} total chapters). Day-by-day schedule with morning/afternoon/evening blocks. High-priority only. Be urgent and specific. Use emojis and bold headers.`;
  try {
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:900,messages:[{role:'user',content:prompt}]})});
    const res=await r.json();
    out.innerHTML=(res.content?.[0]?.text||'Error').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  } catch(e) {
    out.innerHTML=`<strong style="color:var(--danger);">🚨 ${d}-Day Crash Plan — ${name}</strong><br><br>
<strong>📅 Day 1 — Foundation Blitz</strong><br>
🌅 Morning (${Math.ceil(h/3)}h): Core concepts speed review · High-yield formulas<br>
☀️ Afternoon (${Math.ceil(h/3)}h): Chapter summaries · Mind maps<br>
🌙 Evening (${h-Math.ceil(h/3)*2>0?h-Math.ceil(h/3)*2:2}h): Practice problems × 20<br><br>
${d>1?`<strong>📅 Day 2 — Practice Intensive</strong><br>
🌅 Morning: Previous year paper analysis<br>
☀️ Afternoon: Weak areas targeted drill<br>
🌙 Evening: Full mock test + mistake review<br><br>`:''}
${d>2?`<strong>📅 Day ${d} — Final Push</strong><br>
🌅 Morning: Formula + concept revision<br>
☀️ Afternoon: Last mock test<br>
🌙 Evening: Light review only · Sleep by 10pm! 🛌<br><br>`:''}
⚡ Priority order: ${sub.name} core theory → common exam questions → edge cases<br>
💡 Skip low-yield topics! Focus on what's tested most.<br>
⚠️ Sleep 7h minimum — memory consolidation is critical!`;
  }
}

// ════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════
function renderAdmin() {
  const users=[
    {n:'Riya Sharma',e:'riya@email.com',g:'Placement Prep',s:8,l:6},
    {n:'Karan Mehta',e:'karan@email.com',g:'JEE Advanced',s:22,l:12},
    {n:'Priya Singh',e:'priya@email.com',g:'GATE 2026',s:5,l:4},
    {n:'Amit Patel',e:'amit@email.com',g:'Exam Prep',s:15,l:9},
    {n:'Sneha Rao',e:'sneha@email.com',g:'Skill Building',s:3,l:2},
  ];
  document.getElementById('admin-users').innerHTML=users.map(u=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div class="avatar" style="width:30px;height:30px;font-size:11px;">${u.n[0]}</div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:500;">${u.n}</div><div style="font-size:11px;color:var(--text2);">${u.g}</div></div>
      <span class="badge badge-warn" style="font-size:10px;">Lv.${u.l}</span>
      <span class="badge badge-green" style="font-size:10px;">${u.s}🔥</span>
    </div>`).join('');
  const statuses=[
    {l:'AI API Status',v:'Operational',c:'var(--success)'},
    {l:'Database',v:'Healthy',c:'var(--success)'},
    {l:'Notifications',v:'Active',c:'var(--success)'},
    {l:'Response Time',v:'120ms',c:'var(--warn)'},
    {l:'Uptime',v:'99.9%',c:'var(--success)'},
    {l:'AI Calls Today',v:'8,432',c:'var(--accent2)'},
  ];
  document.getElementById('admin-status').innerHTML=statuses.map(s=>`
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:13px;color:var(--text2);">${s.l}</span>
      <span style="font-size:13px;font-weight:600;color:${s.c};">${s.v}</span>
    </div>`).join('');
}

// ════════════════════════════════════════
// POMODORO TIMER
// ════════════════════════════════════════
const TM = S.timer;
function setMode(m) {
  clearInterval(TM.interval); TM.running=false; TM.mode=m;
  document.getElementById('timer-btn').textContent='▶ Start';
  TM.sec=m==='focus'?1500:m==='break'?300:900;
  document.getElementById('timer-lbl').textContent=m==='focus'?'Focus Time':m==='break'?'Short Break':'Long Break';
  ['tm-focus','tm-break','tm-long'].forEach(id=>{ const el=document.getElementById(id); el.style.background='transparent'; el.style.color='var(--text2)'; el.style.border='1px solid var(--border2)'; });
  const active=document.getElementById('tm-'+m);
  active.style.background='rgba(108,99,255,0.2)'; active.style.color='var(--accent2)'; active.style.border='1px solid rgba(108,99,255,0.4)';
  updateTimerDisp();
}
function updateTimerDisp() {
  const m=Math.floor(TM.sec/60),s=TM.sec%60;
  document.getElementById('timer-disp').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const total=TM.mode==='focus'?1500:TM.mode==='break'?300:900;
  document.getElementById('timer-ring').style.setProperty('--prog',((total-TM.sec)/total*360)+'deg');
}
function toggleTimer() {
  if(TM.running){clearInterval(TM.interval);TM.running=false;document.getElementById('timer-btn').textContent='▶ Resume';}
  else{TM.running=true;document.getElementById('timer-btn').textContent='⏸ Pause';TM.interval=setInterval(()=>{if(TM.sec>0){TM.sec--;updateTimerDisp();}else{clearInterval(TM.interval);TM.running=false;if(TM.mode==='focus'){TM.count++;document.getElementById('pomo-count').textContent=TM.count;alert('🎉 Focus done! +50 XP! Take a break.');}else{alert('✅ Break over! Time to focus!');}setMode(TM.mode==='focus'?'break':'focus');}},1000);}
}
function resetTimer(){clearInterval(TM.interval);TM.running=false;document.getElementById('timer-btn').textContent='▶ Start';setMode(TM.mode);}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
window.addEventListener('load', () => {
  // Pre-render timer
  updateTimerDisp();
});
