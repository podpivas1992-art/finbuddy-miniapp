(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const tg = window.Telegram?.WebApp;
  tg?.ready(); tg?.expand();

  const STORE_KEY = "finbuddy_full_demo_v2";
  const today = () => new Date().toISOString().slice(0,10);
  const money = n => new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(Number(n)||0);
  const dateText = d => { if(!d) return "Без даты"; const x = new Date(d+"T12:00:00"); return x.toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"}); };
  const categories = {
    income:["Зарплата","Подработка","Подарок","Возврат долга","Другое"],
    expense:["Продукты","Доставка еды","Транспорт","Развлечения","Покупки","Жильё","Подписки","Здоровье","Подарки","Другое"]
  };
  const seed = {transactions:[
    {id:"demo1",kind:"expense",amount:350,category:"Доставка еды",note:"Перекус",date:today(),createdAt:new Date().toISOString()},
    {id:"demo2",kind:"income",amount:5000,category:"Подработка",note:"Тестовая запись",date:today(),createdAt:new Date().toISOString()},
    {id:"demo3",kind:"expense",amount:1250,category:"Продукты",note:"Покупки",date:today(),createdAt:new Date().toISOString()},
    {id:"demo4",kind:"expense",amount:120,category:"Транспорт",note:"Проезд",date:today(),createdAt:new Date().toISOString()}
  ],goals:[{id:"goal1",name:"Новый телефон",target:50000,saved:16000},{id:"goal2",name:"Поездка в горы",target:80000,saved:9600}],debts:[{id:"debt1",kind:"owed",person:"Дима",amount:5000,note:"Возврат долга",date:""},{id:"debt2",kind:"owe",person:"Мама",amount:2500,note:"Помощь",date:""}]};
  let data;
  try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || seed; } catch { data = seed; }
  if (!Array.isArray(data.transactions)) data = seed;
  let page = "home", opKind = "expense", debtKind = "owed", reportRange = "week", opFilter = "all", categoryFilter = "all", searchTerm = "";
  const pageTitles = {home:"Главная",operations:"Операции",reports:"Статистика",goals:"Цели и накопления",debts:"Долги",advice:"Финансовый совет",settings:"Настройки"};
  const save = () => localStorage.setItem(STORE_KEY,JSON.stringify(data));
  const totals = list => (list||data.transactions).reduce((a,t)=>{ if(t.kind==="income")a.income+=Number(t.amount);else a.expenses+=Number(t.amount);a.balance=a.income-a.expenses;return a;},{income:0,expenses:0,balance:0});
  const safe = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const iconFor = cat => ({ "Доставка еды":"♨","Зарплата":"↗","Подработка":"▣","Продукты":"▤","Транспорт":"↗","Развлечения":"✦","Покупки":"▣","Жильё":"⌂","Подписки":"∞","Здоровье":"＋","Подарок":"◇","Подарки":"◇","Возврат долга":"↩"}[cat]||"◈");
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400);}
  function opRow(t, deletable=true){
    return `<div class="operation"><div class="op-icon ${t.kind}">${iconFor(t.category)}</div><div class="op-main"><b>${safe(t.note||t.category)}</b><small>${safe(t.category)} · ${dateText(t.date)}</small></div><span class="amount ${t.kind}">${t.kind==="income"?"+":"−"} ${money(t.amount)}</span>${deletable?`<button class="small-btn" data-delete-op="${safe(t.id)}" title="Удалить">×</button>`:""}</div>`;
  }
  function empty(title,desc){return `<div class="empty"><strong>${title}</strong>${desc}</div>`;}
  function home(){
    const t=totals(),recent=[...data.transactions].sort((a,b)=>(b.createdAt||b.date).localeCompare(a.createdAt||a.date)).slice(0,5);
    return `<section class="panel hero"><p class="label">ОБЩИЙ БАЛАНС · ДЕМО</p><div class="balance">${money(t.balance)}</div><div class="trend">${t.balance>=0?"↗":"↘"} ${money(Math.abs(t.balance))} ${t.balance>=0?"текущий баланс":"баланс ниже нуля"}</div><div class="grid two" style="margin-top:22px"><div class="stat-card"><div class="stat-icon">↗</div><p class="label">Доходы</p><div class="stat-number">${money(t.income)}</div></div><div class="stat-card"><div class="stat-icon pink">↘</div><p class="label">Расходы</p><div class="stat-number">${money(t.expenses)}</div></div></div><div class="actions"><button class="primary" data-add-kind="income">＋ Доход</button><button class="outline" data-add-kind="expense">− Расход</button></div></section>
    <div class="grid two" style="margin-top:16px"><section class="panel"><div class="section-head"><div><h2>Быстрые действия</h2><p>Управляй деньгами</p></div></div><div class="grid two"><button class="secondary" data-page="reports">⌁ Статистика</button><button class="secondary" data-page="goals">◎ Цели</button><button class="secondary" data-page="debts">⇄ Долги</button><button class="secondary" data-page="advice">✦ Совет</button></div></section><section class="panel"><div class="section-head"><div><h2>Накопления</h2><p>Прогресс по целям</p></div><button class="link-btn" data-page="goals">Все →</button></div>${data.goals.length?data.goals.slice(0,2).map(g=>`<div style="margin:13px 0"><div class="bar-head"><span>${safe(g.name)}</span><b>${Math.min(100,Math.round(g.saved/g.target*100))}%</b></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,g.saved/g.target*100)}%"></div></div></div>`).join(""):empty("Целей пока нет","Создай первую цель")}</section></div>
    <section class="panel" style="margin-top:16px"><div class="section-head"><div><h2>Последние операции</h2><p>Самые свежие записи</p></div><button class="link-btn" data-page="operations">Все операции →</button></div>${recent.length?recent.map(t=>opRow(t)).join(""):empty("Пока пусто","Добавь первую операцию, чтобы увидеть её здесь.")}</section>`;
  }
  function operations(){
    let list=[...data.transactions].sort((a,b)=>(b.createdAt||b.date).localeCompare(a.createdAt||a.date));
    if(opFilter!=="all")list=list.filter(t=>t.kind===opFilter);
    if(categoryFilter!=="all")list=list.filter(t=>t.category===categoryFilter);
    if(searchTerm)list=list.filter(t=>(t.note+" "+t.category).toLowerCase().includes(searchTerm.toLowerCase()));
    return `<section class="panel"><div class="section-head"><div><h2>Все операции</h2><p>${list.length} записей</p></div><button class="primary" data-add-kind="expense">＋ Добавить</button></div><div class="segmented"><button class="segment ${opFilter==="all"?"active":""}" data-op-filter="all">Все</button><button class="segment ${opFilter==="income"?"active":""}" data-op-filter="income">Доходы</button><button class="segment ${opFilter==="expense"?"active":""}" data-op-filter="expense">Расходы</button></div><div class="filter-row"><input class="field" id="operation-search" placeholder="Поиск по описанию" value="${safe(searchTerm)}" style="flex:2"><select id="category-filter"><option value="all">Все категории</option>${[...new Set([...categories.income,...categories.expense])].map(c=>`<option ${categoryFilter===c?"selected":""}>${safe(c)}</option>`).join("")}</select></div>${list.length?list.map(t=>opRow(t)).join(""):empty("Ничего не найдено","Попробуй изменить фильтры или добавь операцию.")}</section>`;
  }
  function reportList(){
    const now=new Date(),days=[];
    const count=reportRange==="year"?12:reportRange==="month"?30:7;
    for(let i=count-1;i>=0;i--){let d=new Date(now);if(reportRange==="year")d=new Date(now.getFullYear(),now.getMonth()-i,1);else d.setDate(d.getDate()-i);d.setHours(0,0,0,0);days.push({date:d,label:reportRange==="year"?d.toLocaleDateString("ru-RU",{month:"short"}):d.toLocaleDateString("ru-RU",{day:"numeric",month:"short"}),income:0,expense:0});}
    data.transactions.forEach(t=>{const dt=new Date((t.date||today())+"T12:00:00");let idx=-1;if(reportRange==="year")idx=days.findIndex(d=>d.date.getFullYear()===dt.getFullYear()&&d.date.getMonth()===dt.getMonth());else idx=days.findIndex(d=>d.date.toDateString()===dt.toDateString());if(idx>=0)days[idx][t.kind==="income"?"income":"expense"]+=Number(t.amount);});
    return days;
  }

  function lineChart(days, keys){
    const W=700,H=245,L=42,R=12,T=18,B=36;
    const ph=H-T-B,pw=W-L-R;
    const max=Math.max(1,...days.flatMap(d=>keys.map(k=>Number(d[k])||0)));
    const x=i=>L+i*pw/Math.max(1,days.length-1);
    const y=v=>T+ph*(1-v/max);
    const colors=["#ff3995","#829bff"];

    const grid=[0,.25,.5,.75,1].map(f=>{
      const yy=T+ph*(1-f);
      return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#203654"/>
      <text x="${L-8}" y="${yy+4}" text-anchor="end" fill="#7890b5" font-size="10">${Math.round(max*f/1000)}k</text>`;
    }).join("");

    const every=Math.max(1,Math.ceil(days.length/7));
    const labels=days.map((d,i)=>
      i%every===0||i===days.length-1
      ? `<text x="${x(i)}" y="${H-10}" text-anchor="middle" fill="#8fa4c7" font-size="10">${safe(d.label)}</text>`
      : ""
    ).join("");

    const lines=keys.map((k,ki)=>{
      const points=days.map((d,i)=>`${x(i)},${y(Number(d[k])||0)}`).join(" ");
      const dots=days.map((d,i)=>{
        const value=Number(d[k])||0;
        return `<circle class="chart-point"
          cx="${x(i)}" cy="${y(value)}" r="5"
          fill="${colors[ki%colors.length]}"
          stroke="#111b2d" stroke-width="2"
          tabindex="0" role="button"
          aria-label="${safe(d.label)}: ${money(value)}"
          data-chart-point="1"
          data-chart-date="${safe(d.label)}"
          data-chart-value="${value}"
          data-chart-series="${ki===0?"Доходы":"Расходы"}"/>`;
      }).join("");
      return `<polyline points="${points}" fill="none"
        stroke="${colors[ki%colors.length]}" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    }).join("");

    return `<div class="chart-wrap" style="position:relative">
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="График финансов">${grid}
        ${keys.length?`<polyline points="${days.map((d,i)=>`${x(i)},${y(Number(d[keys[0]])||0)}`).join(" ")} ${x(days.length-1)},${T+ph} ${x(0)},${T+ph}" fill="url(#pinkFill)" stroke="none"/>`:""}
        <defs><linearGradient id="pinkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ff3995" stop-opacity=".25"/>
          <stop offset="100%" stop-color="#ff3995" stop-opacity="0"/>
        </linearGradient></defs>
        ${lines}${labels}
      </svg>
      <div class="chart-tooltip" hidden
        style="padding:10px 12px;margin-top:6px;border:1px solid #34435e;border-radius:10px;background:#172238;font-size:13px">
      </div>
      <p style="font-size:11px;color:#8fa4c7;margin:5px 0 0">Нажми на точку графика, чтобы увидеть точную сумму.</p>
    </div>`;
  }
function reports(){
    const days=reportList(),t=totals(days.flatMap(d=>[{kind:"income",amount:d.income},{kind:"expense",amount:d.expense}]));
    const cats={};data.transactions.filter(x=>x.kind==="expense").forEach(x=>cats[x.category]=(cats[x.category]||0)+Number(x.amount));
    const catList=Object.entries(cats).sort((a,b)=>b[1]-a[1]),catTotal=catList.reduce((s,x)=>s+x[1],0)||1;
    return `<section class="panel"><div class="section-head"><div><h2>Динамика баланса</h2><p>Сравнивай доходы и расходы</p></div></div><div class="segmented"><button class="segment ${reportRange==="week"?"active":""}" data-range="week">Неделя</button><button class="segment ${reportRange==="month"?"active":""}" data-range="month">30 дней</button><button class="segment ${reportRange==="year"?"active":""}" data-range="year">Год</button></div><div class="chart-box">${lineChart(days,["income","expense"])}</div><div class="legend"><span><i style="background:#829bff"></i>Доходы</span><span><i style="background:#ff3995"></i>Расходы</span></div></section><div class="grid two" style="margin-top:16px"><div class="stat-card"><div class="stat-icon">↗</div><p class="label">Доходы за период</p><div class="stat-number">${money(t.income)}</div></div><div class="stat-card"><div class="stat-icon pink">↘</div><p class="label">Расходы за период</p><div class="stat-number">${money(t.expenses)}</div></div></div><section class="panel" style="margin-top:16px"><div class="section-head"><div><h2>Расходы по категориям</h2><p>Куда уходят деньги</p></div></div>${catList.length?`<div class="bar-list">${catList.slice(0,8).map(([name,value])=>`<div><div class="bar-head"><span>${safe(name)}</span><b>${money(value)} · ${Math.round(value/catTotal*100)}%</b></div><div class="bar-track"><div class="bar-fill" style="width:${value/catTotal*100}%"></div></div></div>`).join("")}</div>`:empty("Пока нет расходов","Добавь расходы, чтобы увидеть распределение.")}</section>`;
  }
  function goals(){
    return `<section class="panel"><div class="section-head"><div><h2>Мои цели</h2><p>Откладывай на важное</p></div><button class="primary" data-open-goal>＋ Создать цель</button></div>${data.goals.length?`<div class="grid two">${data.goals.map(g=>`<div class="goal-card"><div class="goal-top"><div><div class="goal-name">${safe(g.name)}</div><p class="muted" style="font-size:11px;margin:6px 0">${money(g.saved)} накоплено</p></div><button class="small-btn" data-delete-goal="${safe(g.id)}">×</button></div><div class="goal-progress"><div class="progress-track"><div class="progress-fill ${g.saved/g.target>.6?"green":""}" style="width:${Math.min(100,g.saved/g.target*100)}%"></div></div><div class="goal-meta"><span>${Math.min(100,Math.round(g.saved/g.target*100))}% собрано</span><b>Осталось ${money(Math.max(0,g.target-g.saved))}</b></div></div><div class="actions"><button class="secondary" data-add-saving="${safe(g.id)}">＋ Пополнить</button></div></div>`).join("")}</div>`:empty("Целей пока нет","Создай цель, чтобы отслеживать накопления.")}</section>`;
  }
  function debts(){
    const owed=data.debts.filter(d=>d.kind==="owed").reduce((s,d)=>s+d.amount,0),owe=data.debts.filter(d=>d.kind==="owe").reduce((s,d)=>s+d.amount,0);
    return `<div class="grid two"><div class="stat-card"><div class="stat-icon green">↙</div><p class="label">Мне должны</p><div class="stat-number">${money(owed)}</div></div><div class="stat-card"><div class="stat-icon pink">↗</div><p class="label">Я должен</p><div class="stat-number">${money(owe)}</div></div></div><section class="panel" style="margin-top:16px"><div class="section-head"><div><h2>Долги</h2><p>Не теряй из виду возвраты</p></div><button class="primary" data-open-debt>＋ Добавить</button></div><div class="segmented"><button class="segment ${debtKind==="owed"?"active":""}" data-debt-filter="owed">Мне должны</button><button class="segment ${debtKind==="owe"?"active":""}" data-debt-filter="owe">Я должен</button></div><div class="debt-list">${data.debts.filter(d=>d.kind===debtKind).map(d=>`<div class="debt-card"><div class="op-icon ${d.kind==="owed"?"income":"expense"}">⇄</div><div class="op-main"><b>${safe(d.person)}</b><small>${safe(d.note||"Без описания")}${d.date?" · до "+dateText(d.date):""}</small></div><span class="amount ${d.kind==="owed"?"income":"expense"}">${money(d.amount)}</span><button class="small-btn" data-delete-debt="${safe(d.id)}">×</button></div>`).join("")||empty("Здесь пока пусто","Добавь запись о долге.")}</div></section>`;
  }
  function advice(){
    const expenses=data.transactions.filter(t=>t.kind==="expense"),delivery=expenses.filter(t=>t.category==="Доставка еды").reduce((s,t)=>s+t.amount,0),subs=expenses.filter(t=>t.category==="Подписки").reduce((s,t)=>s+t.amount,0),t=totals();
    let headline="Сначала посмотри на регулярные траты",body="Записывай расходы хотя бы неделю. Тогда станет понятно, что действительно съедает бюджет.",potential=0;
    if(delivery>0){headline="Доставка еды — проверь эту статью";body=`На доставку в записанных операциях ушло ${money(delivery)}. Если часть заказов заменить домашней едой, можно было бы сохранить часть этой суммы — без запретов и голодания.`;potential+=delivery*.3;}
    if(subs>0){body+=` Также проверь подписки: за выбранные записи на них ушло ${money(subs)}.`;potential+=subs*.5;}
    if(t.expenses>t.income&&t.income>0){headline="Расходы превышают доходы";body="По записям расходы выше доходов. На время отложи необязательные покупки и проверь крупные категории.";}
    return `<section class="advice-hero"><div class="advice-badge">✦</div><p class="eyebrow" style="margin-top:16px">ФИНАНСОВЫЙ СОВЕТ</p><h2>${headline}</h2><p>${body}</p>${potential?`<div class="saving-number">≈ ${money(potential)}</div><p class="muted" style="font-size:11px">Примерная потенциальная экономия, а не гарантированный результат.</p>`:""}<button class="outline full" data-page="reports">Посмотреть статистику</button></section><section class="panel" style="margin-top:16px"><div class="section-head"><div><h2>Что можно проверить</h2><p>Без жёстких ограничений</p></div></div><div class="operation"><div class="op-icon expense">♨</div><div class="op-main"><b>Доставка еды</b><small>Сравни цену заказа с домашним вариантом</small></div></div><div class="operation"><div class="op-icon">∞</div><div class="op-main"><b>Подписки</b><small>Отмени только те, которыми не пользуешься</small></div></div><div class="operation"><div class="op-icon income">◎</div><div class="op-main"><b>Цель накоплений</b><small>Отложи комфортную сумму, даже небольшую</small></div></div></section>`;
  }
  function settings(){
    return `<section class="panel"><div class="section-head"><div><h2>Настройки</h2><p>Управление приложением</p></div></div><div class="settings-row"><div><b>Валюта</b><small>Российский рубль</small></div><span>₽ RUB</span></div><div class="settings-row"><div><b>Хранение данных</b><small>Пока сохраняются в этом браузере на этом устройстве</small></div><span class="muted">Локально</span></div><div class="settings-row"><div><b>Экспорт операций</b><small>Скачать CSV-файл с записями</small></div><button class="secondary" id="export-csv">Экспорт</button></div><div class="settings-row"><div><b>Демо-данные</b><small>Очистить записи прототипа</small></div><button class="danger-btn" id="clear-data">Очистить</button></div><p class="muted" style="font-size:11px;line-height:1.6;margin-top:18px">Это демонстрационный прототип. Он пока не синхронизируется с Telegram-ботом или файлом finbuddy.db. Не вводи сюда реальные финансовые данные, если важно сохранить их в общей базе.</p></section>`;
  }
 
  function render(){
    if(page==="more")page="advice";
    $("page-title").textContent=pageTitles[page]||"FinBuddy";
    document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page||(page==="advice"&&b.dataset.page==="more")));
    const views={home,operations,reports,goals,debts,advice,settings};
    $("content").innerHTML=(views[page]||home)()+`<p class="footer-note">FinBuddy · Твои деньги. Твои правила.</p>`;

    document.querySelectorAll("[data-chart-point]").forEach(point=>{
      const showValue=()=>{
        const wrap=point.closest(".chart-wrap");
        if(!wrap)return;
        const tip=wrap.querySelector(".chart-tooltip");
        if(!tip)return;
        tip.innerHTML=`<strong>${point.dataset.chartDate}</strong><br>${point.dataset.chartSeries}: <strong>${money(Number(point.dataset.chartValue))}</strong>`;
        tip.hidden=false;
      };
      point.addEventListener("mouseenter",showValue);
      point.addEventListener("focus",showValue);
      point.addEventListener("click",showValue);
      point.addEventListener("touchstart",showValue,{passive:true});
    });
  }
  function populateCategories(){
    $("op-category").innerHTML=categories[opKind].map(c=>`<option>${safe(c)}</option>`).join("");
    document.querySelectorAll("[data-kind]").forEach(b=>b.classList.toggle("active",b.dataset.kind===opKind));
  }
  function openOperation(kind="expense"){
    opKind=kind;populateCategories();$("operation-title").textContent=kind==="income"?"Добавить доход":"Добавить расход";$("op-date").value=today();$("op-error").textContent="";$("operation-dialog").showModal();
  }
  document.addEventListener("click",e=>{
    const nav=e.target.closest("[data-page]");if(nav){e.preventDefault();page=nav.dataset.page;render();return;}
    const add=e.target.closest("[data-add-kind]");if(add){openOperation(add.dataset.addKind);return;}
    if(e.target.closest("[data-open-goal]")){$("goal-dialog").showModal();return;}
    if(e.target.closest("[data-open-debt]")){$("debt-dialog").showModal();return;}
    const kind=e.target.closest("[data-kind]");if(kind){opKind=kind.dataset.kind;populateCategories();$("operation-title").textContent=opKind==="income"?"Добавить доход":"Добавить расход";return;}
    const range=e.target.closest("[data-range]");if(range){reportRange=range.dataset.range;render();return;}
    const filter=e.target.closest("[data-op-filter]");if(filter){opFilter=filter.dataset.opFilter;render();return;}
    const df=e.target.closest("[data-debt-filter]");if(df){debtKind=df.dataset.debtFilter;render();return;}
    const del=e.target.closest("[data-delete-op]");if(del){if(confirm("Удалить эту операцию?")){data.transactions=data.transactions.filter(t=>t.id!==del.dataset.deleteOp);save();render();toast("Операция удалена");}return;}
    const dg=e.target.closest("[data-delete-goal]");if(dg){if(confirm("Удалить цель?")){data.goals=data.goals.filter(g=>g.id!==dg.dataset.deleteGoal);save();render();}return;}
    const dd=e.target.closest("[data-delete-debt]");if(dd){if(confirm("Удалить запись о долге?")){data.debts=data.debts.filter(d=>d.id!==dd.dataset.deleteDebt);save();render();}return;}
    const saving=e.target.closest("[data-add-saving]");if(saving){const g=data.goals.find(x=>x.id===saving.dataset.addSaving);const amount=Number(prompt(`Сколько добавить к цели «${g.name}»?`));if(Number.isFinite(amount)&&amount>0){g.saved+=amount;save();render();toast("Накопления обновлены");}return;}
    const close=e.target.closest("[data-close]");if(close){$(close.dataset.close).close();return;}
    if(e.target.id==="export-csv"){const rows=[["Дата","Тип","Категория","Описание","Сумма"],...data.transactions.map(t=>[t.date,t.kind==="income"?"Доход":"Расход",t.category,t.note,t.amount])];const csv="\\uFEFF"+rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\\r\\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="finbuddy-operations.csv";a.click();URL.revokeObjectURL(url);toast("Экспорт подготовлен");return;}
    if(e.target.id==="clear-data"){if(confirm("Удалить все операции, цели и долги из локального прототипа? Это действие нельзя отменить.")){data={transactions:[],goals:[],debts:[]};save();render();toast("Локальные данные очищены");}return;}
  });
  $("operation-form").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("op-amount").value),category=$("op-category").value;if(!Number.isFinite(amount)||amount<=0){$("op-error").textContent="Укажи сумму больше нуля.";return;}data.transactions.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),kind:opKind,amount,category,note:$("op-note").value.trim(),date:$("op-date").value||today(),createdAt:new Date().toISOString()});save();$("operation-dialog").close();$("operation-form").reset();page="operations";render();toast("Операция сохранена");});
  $("goal-form").addEventListener("submit",e=>{e.preventDefault();const target=Number($("goal-target").value),saved=Number($("goal-saved").value);if(target<=0||saved<0)return;data.goals.push({id:String(Date.now()),name:$("goal-name").value.trim(),target,saved});save();$("goal-dialog").close();$("goal-form").reset();page="goals";render();toast("Цель создана");});
  $("debt-form").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("debt-amount").value);if(amount<=0)return;data.debts.push({id:String(Date.now()),kind:debtKind,person:$("debt-person").value.trim(),amount,note:$("debt-note").value.trim(),date:$("debt-date").value});save();$("debt-dialog").close();$("debt-form").reset();page="debts";render();toast("Долг сохранён");});
  document.querySelectorAll("[data-debt-kind]").forEach(b=>b.addEventListener("click",()=>{debtKind=b.dataset.debtKind;document.querySelectorAll("[data-debt-kind]").forEach(x=>x.classList.toggle("active",x===b));}));
  $("content").addEventListener("change",e=>{if(e.target.id==="category-filter"){categoryFilter=e.target.value;render();}});
  $("content").addEventListener("input",e=>{if(e.target.id==="operation-search"){const pos=e.target.selectionStart;searchTerm=e.target.value;const scroll=window.scrollY;render();const input=$("operation-search");input?.focus();input?.setSelectionRange(pos,pos);window.scrollTo(0,scroll);}});
  $("debt-form").addEventListener("click",e=>{const b=e.target.closest("[data-debt-kind]");if(b){debtKind=b.dataset.debtKind;document.querySelectorAll("[data-debt-kind]").forEach(x=>x.classList.toggle("active",x===b));}});
  save();render();
})();