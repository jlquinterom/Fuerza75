(() => {
  'use strict';
  const KEY = 'fuerza75-v1'; // Conservamos la clave para migrar datos sin pérdida.
  const START = '2026-11-02';
  const END = '2027-01-31';
  const TARGET = 75;
  const TOTAL_WEEKS = 13;
  const HABITS = [
    ['structured', 'Comidas principales organizadas'],
    ['protein', 'Proteína en comidas principales'],
    ['produce', 'Fruta, verdura y otros frescos'],
    ['moderation', 'Picoteo y excesos moderados']
  ];
  const TEMPLATES = {
    A: { title: 'Base de fuerza', day: 'Lunes', exercises: [
      ['Sentadilla goblet / prensa', 3, '8-12', 'reps'],
      ['Press de pecho con mancuernas', 3, '8-12', 'reps'],
      ['Remo con apoyo / banda', 3, '10-12', 'reps'],
      ['Puente de glúteos / hip thrust', 2, '10-15', 'reps'],
      ['Dead bug', 2, '8-10 por lado', 'reps']
    ] },
    B: { title: 'Cadena posterior', day: 'Miércoles', exercises: [
      ['Peso muerto rumano con mancuernas', 3, '8-10', 'reps'],
      ['Jalón al pecho / banda', 3, '8-12', 'reps'],
      ['Zancada inversa / step-up', 2, '8-10 por pierna', 'reps'],
      ['Press de pecho inclinado', 3, '8-12', 'reps'],
      ['Plancha lateral', 2, '20-40 s', 'segundos']
    ] },
    C: { title: 'Fuerza general', day: 'Viernes', exercises: [
      ['Sentadilla goblet / prensa', 3, '10-12', 'reps'],
      ['Flexiones / press con mancuernas', 3, '8-12', 'reps'],
      ['Remo sentado / banda', 3, '8-12', 'reps'],
      ['Curl femoral / puente de glúteos', 2, '10-15', 'reps'],
      ['Pallof press', 2, '10-12 por lado', 'reps']
    ] }
  };
  const ACTIVITY = { brisk: 'Caminata rápida', gentle: 'Paseo suave', long: 'Caminata larga', golf: 'Golf', padel: 'Pádel' };
  const DEFAULT = () => ({ version: 2, workouts: [], activities: [], weights: [], waists: [], meals: [] });
  const pad = n => String(n).padStart(2, '0');
  const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dateString = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const today = () => dateString(new Date());
  const parseDay = str => new Date(`${str}T12:00:00`);
  const addDays = (date, days) => { const d = parseDay(date); d.setDate(d.getDate() + days); return dateString(d); };
  const dateOK = value => typeof value === 'string' && /^20\d\d-\d\d-\d\d$/.test(value) && !Number.isNaN(parseDay(value).valueOf()) && dateString(parseDay(value)) === value;
  const fmtDay = str => parseDay(str).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmt = (value, digits=1) => Number(value).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const weekFor = date => Math.max(1, Math.min(TOTAL_WEEKS, Math.floor((parseDay(date) - parseDay(START)) / 86400000 / 7) + 1));
  const startWeek = number => addDays(START, (number - 1) * 7);
  const endWeek = number => addDays(startWeek(number), 6);
  const withinWeek = (date, number) => date >= startWeek(number) && date <= endWeek(number);
  const phase = number => number <= 2 ? 'Readaptación' : number <= 6 ? 'Construcción' : number <= 10 ? 'Progresión' : 'Consolidación';
  const aligned = meal => HABITS.reduce((count, [key]) => count + (meal?.[key] ? 1 : 0), 0) >= 3;
  const latest = list => [...list].sort((a,b) => b.date.localeCompare(a.date))[0];
  const str = (value, max=500) => { if (typeof value !== 'string' || value.length > max) throw Error('Texto incorrecto'); return value; };
  const num = (value, min, max) => { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw Error('Valor fuera de rango'); return value; };
  function normalizeData(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Formato incorrecto');
    const out = DEFAULT();
    const kinds = ['workouts', 'activities', 'weights', 'waists', 'meals'];
    for (const kind of kinds) {
      if (!Array.isArray(input[kind]) || input[kind].length > 10000) throw Error('Colección incorrecta');
      out[kind] = input[kind].map(item => {
        if (!item || typeof item !== 'object' || !dateOK(item.date)) throw Error('Fecha incorrecta');
        const base = { id: typeof item.id === 'string' && /^[A-Za-z0-9_-]{1,119}$/.test(item.id) ? item.id : id(), date: item.date };
        if (kind === 'weights' || kind === 'waists') return { ...base, value: num(item.value, 1, kind === 'weights' ? 350 : 250) };
        if (kind === 'activities') {
          if (!Object.hasOwn(ACTIVITY, item.kind)) throw Error('Actividad incorrecta');
          return { ...base, kind: item.kind, minutes: num(item.minutes, 1, 600), note: str(item.note ?? '', 300) };
        }
        if (kind === 'meals') {
          const meal = { ...base };
          for (const [key] of HABITS) meal[key] = item[key] === true;
          return meal;
        }
        if (!Object.hasOwn(TEMPLATES, item.kind) || !Array.isArray(item.exercises) || item.exercises.length > 12) throw Error('Sesión incorrecta');
        return { ...base, kind: item.kind, note: str(item.note ?? '', 500), exercises: item.exercises.map(ex => {
          if (!ex || !Array.isArray(ex.sets) || ex.sets.length > 10) throw Error('Series incorrectas');
          return { name: str(ex.name, 150), sets: ex.sets.map(set => ({ reps: num(set.reps, 0, 300), kg: num(set.kg, 0, 500) })) };
        }) };
      });
      const usedIds = new Set();
      for (const record of out[kind]) {
        while (usedIds.has(record.id)) record.id = id();
        usedIds.add(record.id);
      }
    }
    // Un registro de alimentación y una medición de cada tipo por fecha.
    out.meals = [...new Map(out.meals.map(x => [x.date, x])).values()];
    for (const kind of ['weights','waists']) out[kind] = [...new Map(out[kind].map(x => [x.date, x])).values()];
    return out;
  }
  let db;
  let storageIssue = null;
  try {
    const original = localStorage.getItem(KEY);
    db = original ? normalizeData(JSON.parse(original)) : DEFAULT();
  } catch (error) {
    storageIssue = 'Los datos guardados no se pueden leer. No se sobrescribirán hasta recuperar una copia o reiniciar los datos.';
    db = DEFAULT();
  }
  let currentPage = 'home';
  let selectedWeek = weekFor(today());
  let selectedDay = withinWeek(today(), selectedWeek) ? today() : startWeek(selectedWeek);
  const app = document.getElementById('app');
  const dialog = document.getElementById('dialog');
  const dialogContents = document.getElementById('dialogContents');
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(message, error=false) {
    toastEl.textContent = message;
    toastEl.className = `show${error ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = ''; }, 3400);
  }
  function commit(change, allowRecovery=false) {
    if (storageIssue && !allowRecovery) { toast('Antes debes recuperar o reiniciar el almacenamiento', true); return false; }
    try {
      const next = structuredClone(db);
      change(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      db = next;
      storageIssue = null;
      toast('Guardado en este dispositivo');
      return true;
    } catch (error) {
      toast('No se han guardado los cambios. Comprueba el almacenamiento.', true);
      return false;
    }
  }
  function summary(number=selectedWeek) {
    const sessions = db.workouts.filter(x => withinWeek(x.date, number));
    const activities = db.activities.filter(x => withinWeek(x.date, number));
    // Las caminatas objetivo son rápidas, >=30 min y en días distintos.
    const walkDays = new Set(activities.filter(x => x.kind === 'brisk' && x.minutes >= 30).map(x => x.date));
    const walkingMinutes = activities.filter(x => ['brisk','long','gentle'].includes(x.kind)).reduce((sum,x) => sum + x.minutes, 0);
    const meals = db.meals.filter(x => withinWeek(x.date, number) && aligned(x));
    const weights = db.weights.filter(x => withinWeek(x.date, number));
    return { strength: sessions.length, walks: walkDays.size, walkingMinutes, meals: meals.length,
      weight: weights.length ? weights.reduce((sum,x) => sum + x.value, 0) / weights.length : null };
  }
  function metric(label, n, goal) {
    const percentage = Math.min(100, Math.round((n / goal) * 100));
    return `<div class="metric ${n >= goal ? 'complete' : ''}"><div class="row"><span>${esc(label)}</span><strong>${n} / ${goal}</strong></div><div class="progressline"><div style="width:${percentage}%"></div></div></div>`;
  }
  function weekPicker() {
    return `<div class="weekpicker"><button type="button" data-week="prev" aria-label="Semana anterior" ${selectedWeek === 1 ? 'disabled' : ''}>‹</button><div><strong>Semana ${selectedWeek} de ${TOTAL_WEEKS}</strong><small>${fmtDay(startWeek(selectedWeek))} – ${fmtDay(endWeek(selectedWeek))} · ${phase(selectedWeek)}</small></div><button type="button" data-week="next" aria-label="Semana siguiente" ${selectedWeek === TOTAL_WEEKS ? 'disabled' : ''}>›</button></div>`;
  }
  function statusMessage() {
    if (today() < START) return `<p class="notice">El programa comienza el ${fmtDay(START)}. Puedes preparar registros o revisar las rutinas.</p>`;
    if (today() > END) return '<p class="notice">El programa de 13 semanas ha terminado. Puedes consultar y corregir el historial; las nuevas mediciones se seguirán guardando.</p>';
    return '';
  }
  function render() {
    document.querySelectorAll('.bottom button').forEach(button => {
      const current = button.dataset.page === currentPage;
      button.classList.toggle('active', current);
      if (current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    const renderPage = { home: renderHome, strength: renderStrength, activity: renderActivity, progress: renderProgress };
    renderPage[currentPage]?.();
    if (storageIssue) app.insertAdjacentHTML('afterbegin', `<div class="warning" role="alert">${esc(storageIssue)} <button type="button" class="btn tiny" data-settings>Opciones</button></div>`);
  }
  function renderHome() {
    const s = summary();
    const recent = latest(db.weights);
    const meal = db.meals.find(x => x.date === selectedDay) || {};
    const days = Array.from({ length: 7 }, (_, i) => addDays(startWeek(selectedWeek), i));
    app.innerHTML = `<section class="hero"><span class="eyebrow">Tu plan de 13 semanas</span><h1>Hacia los ${TARGET} kg</h1><div>${phase(selectedWeek)} · Semana ${selectedWeek}</div><div class="heroGrid"><div><span class="weight">${recent ? fmt(recent.value) : '—'} <small>kg</small></span></div><div class="goal">${fmt(TARGET)} kg<small>objetivo orientativo</small></div></div><div class="help">${recent ? `Última medición: ${fmtDay(recent.date)}` : 'Registra tu primer peso; no se muestran datos supuestos'}</div></section>
      ${statusMessage()}<h2>Resumen de la semana</h2>${weekPicker()}
      <div class="grid"><article class="card mini"><span class="symbol">◆</span><span class="big">${s.strength} / 3</span><b>Fuerza</b><div class="desc">sesiones completas</div></article><article class="card mini"><span class="symbol">↗</span><span class="big">${s.walks} / 3</span><b>Caminatas</b><div class="desc">rápidas, mínimo 30 min</div></article></div>
      <div class="card stacktop">${metric('Fuerza', s.strength, 3)}${metric('Caminatas rápidas', s.walks, 3)}${metric('Alimentación alineada', s.meals, 5)}<p class="notice">Semana mínima viable: 2 sesiones de fuerza, 2 caminatas rápidas y 4 días de alimentación alineada.</p></div>
      <h2>Alimentación · elige un día</h2><div class="card"><div class="daystrip" aria-label="Elegir fecha">${days.map((day,i) => `<button type="button" data-day="${day}" class="daychip ${day === selectedDay ? 'selected' : ''} ${aligned(db.meals.find(x=>x.date===day)) ? 'done' : ''}" aria-pressed="${day === selectedDay}"><small>${['L','M','X','J','V','S','D'][i]}</small><b>${day.slice(-2)}</b></button>`).join('')}</div>
      <p class="subtle small">${fmtDay(selectedDay)}. Un día cuenta si cumples 3 de 4 criterios.</p>
      <form id="mealForm" class="checks">${HABITS.map(([key,label]) => `<label class="check"><input type="checkbox" name="${key}" ${meal[key] ? 'checked' : ''}>${esc(label)}</label>`).join('')}<div class="footrow"><span class="pill ${aligned(meal) ? 'good' : ''}" id="mealStatus">${aligned(meal) ? 'Día alineado' : 'Sin completar'}</span><button class="btn tiny" type="submit">Guardar día</button></div></form></div>
      <h2>Prioridad de esta fase</h2><div class="hint">${selectedWeek <= 2 ? 'Readaptación: 2 series por ejercicio, cargas prudentes y recuperación progresiva.' : 'Tres sesiones de fuerza, progresión gradual y caminatas rápidas regulares.'}</div><p class="notice">Detén el entrenamiento ante dolor agudo, síntomas neurológicos, mareo, dolor torácico o dificultad respiratoria anormal.</p>`;
    document.getElementById('mealForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (commit(next => {
        next.meals = next.meals.filter(x => x.date !== selectedDay);
        next.meals.push({ id: id(), date: selectedDay, ...Object.fromEntries(HABITS.map(([key]) => [key, form.elements[key].checked])) });
      })) render();
    });
    document.getElementById('mealForm').addEventListener('change', event => {
      const f = event.currentTarget;
      const n = HABITS.filter(([key]) => f.elements[key].checked).length;
      const label = document.getElementById('mealStatus');
      label.textContent = n >= 3 ? 'Día alineado' : `${n} de 4 criterios`;
      label.className = `pill ${n >= 3 ? 'good' : ''}`;
    });
  }
  function row(title, subtitle, right, collection, entryId, editable=true) {
    return `<div class="entry"><div><b>${esc(title)}</b><small>${esc(subtitle)}</small></div><div class="right"><span class="numeric">${esc(right)}</span>${editable ? `<button class="edit" data-edit="${collection}:${esc(entryId)}" aria-label="Editar registro">Editar</button>` : ''}<button type="button" class="remove" data-delete="${collection}:${esc(entryId)}" aria-label="Eliminar registro">×</button></div></div>`;
  }
  const empty = message => `<div class="empty"><div class="emptyIcon">◌</div>${esc(message)}</div>`;
  const sorted = values => [...values].sort((a,b) => b.date.localeCompare(a.date));
  function renderStrength() {
    const history = sorted(db.workouts);
    app.innerHTML = `<span class="eyebrow">Fuerza sostenible</span><h1>Entrenamiento</h1><p class="subtle">Tres rutinas de cuerpo completo. Adapta los días al trabajo, la familia y el descanso.</p>
      ${Object.entries(TEMPLATES).map(([key, template]) => `<button class="workout" data-workout="${key}"><span class="letter">${key}</span><span class="details"><b>${esc(template.title)}</b><small>${template.day} orientativo · ${template.exercises.length} ejercicios</small></span><span class="arrow">›</span></button>`).join('')}
      <p class="notice">Calienta 5–8 minutos. En las semanas 1–2 prioriza la técnica, 2 series por ejercicio y un esfuerzo conservador. Las cargas anteriores son solo una referencia.</p>
      <h2>Sesiones registradas</h2><section class="card">${history.length ? history.map(x => row(`Rutina ${x.kind}`, `${fmtDay(x.date)} · ${x.exercises.length} ejercicios`, `${x.exercises.reduce((sum,e)=>sum+e.sets.length,0)} series`, 'workouts', x.id)).join('') : empty('Todavía no has registrado sesiones.')}</section>`;
  }
  function renderActivity() {
    const s = summary();
    const records = sorted(db.activities);
    app.innerHTML = `<span class="eyebrow">Actividad cotidiana</span><h1>Movimiento</h1>${weekPicker()}
      <section class="card"><div class="headingrow"><div><b>${s.walks} días de caminata rápida</b><div class="subtle small">${s.walkingMinutes} min caminando esta semana</div></div><button class="btn" data-add="activity">+ Añadir</button></div><p class="notice">Solo cuentan para el objetivo las caminatas rápidas de al menos 30 minutos, en días diferentes. Los paseos, caminatas largas, golf y pádel se registran sin contar automáticamente.</p></section>
      <h2>Historial</h2><section class="card">${records.length ? records.map(x => row(ACTIVITY[x.kind], fmtDay(x.date), `${x.minutes} min`, 'activities', x.id)).join('') : empty('No hay actividades registradas.')}</section>`;
  }
  function weightAverages() {
    const groups = new Map();
    for (const item of db.weights) {
      const monday = addDays(item.date, -(parseDay(item.date).getDay()+6)%7);
      if (!groups.has(monday)) groups.set(monday, []);
      groups.get(monday).push(item.value);
    }
    return [...groups.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([date, values]) => ({ date, value: values.reduce((a,b) => a+b,0) / values.length }));
  }
  function renderProgress() {
    const weight = latest(db.weights), waist = latest(db.waists);
    app.innerHTML = `<span class="eyebrow">Evolución, no perfección</span><h1>Progreso</h1><div class="grid"><div class="card mini"><div class="subtle small">Último peso</div><span class="big">${weight ? `${fmt(weight.value)} kg` : '—'}</span><button class="btn tiny" data-add="weight">+ Peso</button></div><div class="card mini"><div class="subtle small">Última cintura</div><span class="big">${waist ? `${fmt(waist.value)} cm` : '—'}</span><button class="btn tiny secondary" data-add="waist">+ Cintura</button></div></div>
      <h2>Media semanal de peso</h2><section class="card">${db.weights.length ? '<div class="chartWrap"><canvas id="weightChart" role="img" aria-label="Gráfico de peso medio por semana y objetivo de 75 kilogramos"></canvas></div><div id="weightSummary" class="notice"></div>' : empty('Añade pesajes de tres días distintos por semana para seguir la tendencia.')}</section>
      <h2>Mediciones de peso</h2><section class="card">${db.weights.length ? sorted(db.weights).map(x => row(fmtDay(x.date), 'Peso', `${fmt(x.value)} kg`, 'weights', x.id)).join('') : empty('No hay mediciones.')}</section>
      <h2>Perímetro de cintura</h2><section class="card">${db.waists.length ? sorted(db.waists).map(x => row(fmtDay(x.date), 'Cintura', `${fmt(x.value)} cm`, 'waists', x.id)).join('') : empty('Sin medidas de cintura.')}</section>`;
    if (db.weights.length) requestAnimationFrame(drawWeightChart);
  }
  function drawWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    const points = weightAverages();
    const width = canvas.clientWidth || 320, height = 220, ratio = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = width * ratio; canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    const left = 45, right = width-15, top = 15, bottom = height-32;
    const values = points.map(p => p.value).concat(TARGET);
    const min = Math.floor(Math.min(...values)-1), max = Math.ceil(Math.max(...values)+1);
    const y = value => bottom - ((value-min)/(max-min))*(bottom-top);
    const x = i => points.length === 1 ? (left+right)/2 : left + i*(right-left)/(points.length-1);
    const style = getComputedStyle(document.body);
    ctx.strokeStyle = style.getPropertyValue('--line').trim();
    ctx.fillStyle = style.getPropertyValue('--muted').trim();
    ctx.font = '11px system-ui';
    for (let i=0; i<=4; i++) {
      const value = min+(max-min)*i/4, lineY=y(value);
      ctx.beginPath(); ctx.moveTo(left,lineY); ctx.lineTo(right,lineY); ctx.stroke();
      ctx.fillText(value.toFixed(0),5,lineY+4);
    }
    ctx.strokeStyle='#248b64'; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(left,y(TARGET)); ctx.lineTo(right,y(TARGET)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle='#7770d7'; ctx.lineWidth=2.5; ctx.beginPath();
    points.forEach((p,i) => i ? ctx.lineTo(x(i),y(p.value)) : ctx.moveTo(x(i),y(p.value)));
    ctx.stroke();
    points.forEach((p,i) => { ctx.fillStyle='#7770d7'; ctx.beginPath(); ctx.arc(x(i),y(p.value),4,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle=style.getPropertyValue('--muted').trim();
    ctx.fillText(points[0].date.slice(5).replace('-','/'),left,bottom+20);
    if (points.length>1) ctx.fillText(points.at(-1).date.slice(5).replace('-','/'),right-33,bottom+20);
    document.getElementById('weightSummary').textContent = `Última media semanal: ${fmt(points.at(-1).value)} kg. Objetivo orientativo: ${TARGET} kg.`;
  }
  function showDialog(title, body, onSubmit) {
    dialogContents.innerHTML = `<div class="dialoghead"><h2>${esc(title)}</h2><button type="button" class="close" data-close aria-label="Cerrar">×</button></div>${body}`;
    dialog.showModal();
    if (onSubmit) dialogContents.querySelector('form')?.addEventListener('submit', onSubmit);
  }
  const fieldDate = date => `<label class="field">Fecha<input type="date" name="date" value="${esc(date)}" min="2000-01-01" max="2099-12-31" required></label>`;
  function openWorkout(kind, existing=null) {
    const template = TEMPLATES[kind];
    if (!template) return;
    const date = existing?.date || (today() >= START && today() <= END ? today() : startWeek(selectedWeek));
    let draft = existing?.exercises?.map(ex => ({ name: ex.name, sets: ex.sets.map(set => ({ ...set })) })) || [];
    function makeExercises(date) {
      const n = weekFor(date);
      return template.exercises.map(([name, count, reps, unit], i) => {
        const number = existing && draft[i] ? draft[i].sets.length : n <= 2 ? 2 : count;
        const reference = sorted(db.workouts.filter(x => x.kind === kind && x.id !== existing?.id && x.date <= date))[0]?.exercises?.[i];
        const prior = reference?.sets?.[0]?.kg;
        return `<fieldset class="exercise"><legend>${esc(name)}</legend><small>Rango: ${esc(reps)}${prior !== undefined ? ` · Referencia previa: ${fmt(prior)} kg` : ''}</small>${Array.from({ length: number }, (_,j) => {
          const saved = draft[i]?.sets?.[j];
          return `<div class="setrow"><span>Serie ${j+1}</span><label>${unit==='segundos'?'Seg.':'Reps'}<input type="number" inputmode="numeric" name="r${i}_${j}" value="${saved?.reps ?? Number.parseInt(reps,10)}" min="0" max="300" step="1" required></label><label>kg<input type="number" inputmode="decimal" name="k${i}_${j}" value="${saved?.kg ?? 0}" min="0" max="500" step="0.5" required></label></div>`;
        }).join('')}</fieldset>`;
      }).join('');
    }
    showDialog(`${existing ? 'Editar' : 'Registrar'} rutina ${kind}`, `<form id="workoutForm">${fieldDate(date)}<p class="notice" id="setsHint">${weekFor(date) <= 2 ? 'Semana de readaptación: 2 series por ejercicio.' : 'Series según la rutina.'} Para autocarga y bandas sin carga externa, usa 0 kg.</p><div id="exerciseFields">${makeExercises(date)}</div><label class="field">Nota opcional<textarea name="note" maxlength="500" placeholder="Sensaciones o adaptaciones">${esc(existing?.note || '')}</textarea></label><div class="dialogactions"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">${existing ? 'Guardar cambios' : 'Guardar sesión'}</button></div></form>`, event => {
      event.preventDefault();
      const form = event.currentTarget;
      const dateValue = form.elements.date.value;
      if (!dateOK(dateValue)) { toast('Fecha incorrecta', true); return; }
      const exercises = template.exercises.map(([name],i) => ({ name, sets: [...form.querySelectorAll(`input[name^="r${i}_"]`)].map((element,j) => ({ reps: Number(element.value), kg: Number(form.elements[`k${i}_${j}`].value) })) }));
      if (commit(next => {
        const record = { id: existing?.id || id(), date: dateValue, kind, exercises, note: form.elements.note.value.trim() };
        if (existing) next.workouts = next.workouts.map(x => x.id === existing.id ? record : x);
        else next.workouts.push(record);
      })) { dialog.close(); render(); }
    });
    const form = document.getElementById('workoutForm');
    form.elements.date.addEventListener('change', event => {
      // Capturamos lo tecleado ANTES de cambiar las series al modificar la fecha.
      draft = template.exercises.map(([name],i) => ({ name, sets: [...form.querySelectorAll(`input[name^="r${i}_"]`)].map((el,j)=>({ reps: Number(el.value), kg: Number(form.elements[`k${i}_${j}`].value) })) }));
      const dateValue = event.currentTarget.value;
      if (!dateOK(dateValue)) return;
      document.getElementById('exerciseFields').innerHTML = makeExercises(dateValue);
      document.getElementById('setsHint').textContent = weekFor(dateValue) <= 2 ? 'Semana de readaptación: 2 series por ejercicio. Para autocarga o bandas, 0 kg.' : 'Series según la rutina. Para autocarga o bandas, 0 kg.';
    });
  }
  function openActivity(existing=null) {
    showDialog(existing ? 'Editar actividad' : 'Añadir actividad', `<form>${fieldDate(existing?.date || (withinWeek(today(),selectedWeek) ? today() : startWeek(selectedWeek)))}<label class="field">Tipo de actividad<select name="kind">${Object.entries(ACTIVITY).map(([kind,label]) => `<option value="${kind}" ${existing?.kind===kind?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="field">Minutos<input type="number" name="minutes" inputmode="numeric" value="${existing?.minutes ?? 40}" min="1" max="600" required></label><label class="field">Nota opcional<input name="note" maxlength="300" value="${esc(existing?.note || '')}" placeholder="Ruta o sensaciones"></label><div class="dialogactions"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`, event => {
      event.preventDefault(); const form=event.currentTarget;
      if (!dateOK(form.elements.date.value)) { toast('Fecha incorrecta', true); return; }
      const record = { id: existing?.id || id(), date:form.elements.date.value, kind:form.elements.kind.value, minutes:Number(form.elements.minutes.value), note:form.elements.note.value.trim() };
      if (commit(next => { if (existing) next.activities = next.activities.map(x=>x.id===existing.id ? record : x); else next.activities.push(record); })) { dialog.close(); render(); }
    });
  }
  function openMeasurement(type, existing=null) {
    const weight = type === 'weights';
    const list = db[type];
    const initialValue = existing?.value ?? latest(list)?.value ?? '';
    showDialog(`${existing ? 'Editar' : 'Registrar'} ${weight ? 'peso' : 'cintura'}`, `<form>${fieldDate(existing?.date || today())}<label class="field">${weight?'Peso (kg)':'Cintura (cm)'}<input type="number" inputmode="decimal" name="value" min="1" max="${weight?350:250}" step="0.1" value="${initialValue}" placeholder="${weight?'Ej. 82,5':'Ej. 90,0'}" required></label><p class="notice">${weight?'Idealmente tres pesajes por semana en condiciones comparables.':'Medición aproximada una vez al mes.'} Una medición nueva en la misma fecha reemplazará la anterior.</p><div class="dialogactions"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`, event => {
      event.preventDefault(); const form=event.currentTarget, date=form.elements.date.value;
      if (!dateOK(date)) { toast('Fecha incorrecta', true); return; }
      const record = { id: existing?.id || id(), date, value:Number(form.elements.value.value) };
      if (commit(next => { next[type] = next[type].filter(x => x.id !== existing?.id && x.date !== date); next[type].push(record); })) { dialog.close(); render(); }
    });
  }
  function settings() {
    showDialog('Datos y privacidad', `<div class="card"><h3>Privacidad local</h3><p class="small">La app no tiene cuentas, publicidad ni analítica. Los entrenamientos, la alimentación y las medidas se guardan en el almacenamiento local de esta instalación. El servidor solo entrega los archivos de la web y puede conservar registros técnicos de acceso.</p><p class="small"><strong>Recomendación:</strong> exporta una copia JSON semanal y guárdala en Archivos/iCloud Drive. Si borras la app o sus datos, puedes perder los registros.</p><button type="button" class="btn full" id="exportBtn">Exportar copia JSON</button><button type="button" class="btn secondary full topgap" id="importBtn">Importar copia JSON</button>${storageIssue ? '<button type="button" class="btn danger full topgap" id="recoverBtn">Reiniciar almacenamiento dañado</button>' : ''}</div><h3 class="section-gap">Programa</h3><p class="small">2 nov 2026 – 31 ene 2027. Objetivo orientativo: 75 kg; tres sesiones de fuerza, tres caminatas rápidas y cinco días de alimentación alineada por semana.</p><p class="notice">No integra Apple Health ni Apple Watch. No ofrece diagnóstico ni recomendaciones médicas individualizadas.</p><p class="small subtle">Fuerza75 · versión 1.1</p>`);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('recoverBtn')?.addEventListener('click', () => {
      if (confirm('¿Reiniciar los registros locales? Antes, intenta recuperar el historial desde una copia.')) {
        db=DEFAULT(); if (commit(()=>{},true)) { dialog.close(); render(); }
      }
    });
  }
  function exportData() {
    if (storageIssue) { toast('Los datos actuales están dañados; recupera una copia antes de exportar.', true); return; }
    const blob = new Blob([JSON.stringify(db,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href=url; link.download=`Fuerza75-copia-${today()}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    toast('Copia generada: guárdala en Archivos');
  }
  document.getElementById('importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error('Archivo demasiado grande');
      const backup = normalizeData(JSON.parse(await file.text()));
      if (!confirm('La importación reemplazará todos los datos actuales de ESTA instalación. ¿Continuar?')) return;
      if (commit(next => { Object.assign(next, backup); }, true)) { dialog.close(); render(); toast('Copia restaurada correctamente'); }
    } catch (error) { toast(`Importación fallida: ${error.message}`, true); }
    finally { event.target.value=''; }
  });
  document.body.addEventListener('click', event => {
    const target = event.target;
    const page = target.closest('[data-page]');
    if (page) { currentPage=page.dataset.page; render(); window.scrollTo(0,0); return; }
    const weekButton = target.closest('[data-week]');
    if (weekButton) { selectedWeek=Math.max(1,Math.min(TOTAL_WEEKS,selectedWeek+(weekButton.dataset.week==='next'?1:-1))); selectedDay=withinWeek(today(),selectedWeek) ? today() : startWeek(selectedWeek); render(); return; }
    const dayButton = target.closest('[data-day]');
    if (dayButton) { selectedDay=dayButton.dataset.day; render(); return; }
    const routine = target.closest('[data-workout]');
    if (routine) { openWorkout(routine.dataset.workout); return; }
    const add = target.closest('[data-add]');
    if (add) { if (add.dataset.add==='activity') openActivity(); else openMeasurement(add.dataset.add==='weight'?'weights':'waists'); return; }
    if (target.closest('[data-settings]')) { settings(); return; }
    if (target.closest('[data-close]')) { dialog.close(); return; }
    const edit = target.closest('[data-edit]');
    if (edit) {
      const [collection,recordId] = edit.dataset.edit.split(':');
      const record = db[collection]?.find(x => x.id===recordId);
      if (!record) return;
      if (collection==='workouts') openWorkout(record.kind,record);
      else if (collection==='activities') openActivity(record);
      else if (['weights','waists'].includes(collection)) openMeasurement(collection,record);
      return;
    }
    const del = target.closest('[data-delete]');
    if (del) {
      const [collection, recordId] = del.dataset.delete.split(':');
      if (!['workouts','activities','weights','waists'].includes(collection)) return;
      if (confirm('¿Eliminar este registro?')) if (commit(next => { next[collection] = next[collection].filter(x => x.id !== recordId); })) render();
    }
  });
  document.getElementById('settingsBtn').addEventListener('click', settings);
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.getElementById('updateBtn').addEventListener('click', () => location.reload());
  if ('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.register('./sw.js').catch(() => toast('No se pudo activar el modo sin conexión', true));
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) document.getElementById('updateBanner').hidden=false;
    });
  }
  render();
})();
