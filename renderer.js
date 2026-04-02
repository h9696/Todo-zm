let tasks=[];
let categories=[];
let sortable=null;

const state={selectedCategories:[],statusFilter:'all',mode:'add',editingTaskId:null};
const el={};

document.addEventListener('DOMContentLoaded',async()=>{cacheElements();bindEvents();await loadData();renderAll();initSortable();setupGlassInteractions();setupCustomMenu();});

function cacheElements(){
  el.totalCount=document.getElementById('totalCount');
  el.todayCn=document.getElementById('todayCn');
  el.categoriesList=document.getElementById('categoriesList');
  el.taskList=document.getElementById('taskList');
  el.mainPane=document.querySelector('.main-pane');
  el.composer=document.querySelector('.composer');
  el.taskInput=document.getElementById('taskInput');
  el.addTaskBtn=document.getElementById('addTaskBtn');
  el.addCategoryBtn=document.getElementById('addCategoryBtn');
  el.filterAll=document.getElementById('filterAll');
  el.filterIncomplete=document.getElementById('filterIncomplete');
  el.filterCompleted=document.getElementById('filterCompleted');
  el.taskModal=document.getElementById('taskModal');
  el.taskModalTitle=document.getElementById('taskModalTitle');
  el.taskModalInput=document.getElementById('taskModalInput');
  el.taskModalDate=document.getElementById('taskModalDate');
  el.taskModalDateCn=document.getElementById('taskModalDateCn');
  el.clearDateBtn=document.getElementById('clearDateBtn');
  el.taskModalCategories=document.getElementById('taskModalCategories');
  el.taskModalCancel=document.getElementById('taskModalCancel');
  el.taskModalSave=document.getElementById('taskModalSave');
  el.categoryModal=document.getElementById('categoryModal');
  el.categoryNameInput=document.getElementById('categoryNameInput');
  el.categoryModalCancel=document.getElementById('categoryModalCancel');
  el.categoryModalSave=document.getElementById('categoryModalSave');
  el.customMenuBar=document.getElementById('customMenuBar');
  el.menuRoots=Array.from(document.querySelectorAll('.menu-root'));
  el.menuPanels=Array.from(document.querySelectorAll('.menu-panel'));
  el.menuItems=Array.from(document.querySelectorAll('.menu-item'));
}

function bindEvents(){
  el.addTaskBtn.addEventListener('click',beginAddTask);
  el.taskInput.addEventListener('keydown',(e)=>e.key==='Enter'&&beginAddTask());
  el.addCategoryBtn.addEventListener('click',openCategoryModal);
  el.filterAll.addEventListener('change',()=>{if(el.filterAll.checked){state.statusFilter='all';renderTasks();}});
  el.filterIncomplete.addEventListener('change',()=>{if(el.filterIncomplete.checked){state.statusFilter='incomplete';renderTasks();}});
  el.filterCompleted.addEventListener('change',()=>{if(el.filterCompleted.checked){state.statusFilter='completed';renderTasks();}});
  el.taskModalCancel.addEventListener('click',closeTaskModal);
  el.taskModalSave.addEventListener('click',submitTaskModal);
  el.taskModalDate.addEventListener('change',()=>{el.taskModalDateCn.textContent=formatDateCn(el.taskModalDate.value);});
  el.clearDateBtn.addEventListener('click',()=>{el.taskModalDate.value='';el.taskModalDateCn.textContent='';});
  el.categoryModalCancel.addEventListener('click',closeCategoryModal);
  el.categoryModalSave.addEventListener('click',submitCategoryModal);
  el.taskModal.addEventListener('click',(e)=>e.target===el.taskModal&&closeTaskModal());
  el.categoryModal.addEventListener('click',(e)=>e.target===el.categoryModal&&closeCategoryModal());
  el.taskList.addEventListener('scroll',()=>{
    const s=el.taskList.scrollTop;
    const ratio=Math.min(s/80,1);
    el.composer.style.background=`rgba(255,255,255,${0.22+ratio*0.28})`;
    el.composer.style.backdropFilter=`blur(${8+ratio*10}px)`;
  });
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeTaskModal();closeCategoryModal();}});
}

async function loadData(){
  const data=await window.electronAPI.loadData();
  categories=(Array.isArray(data.categories)?data.categories:[]).map((c)=>typeof c==='string'?{name:c,color:getCategoryColor(c)}:{name:c.name,color:c.color||getCategoryColor(c.name)}).filter((c)=>c&&c.name);
  const names=new Set(categories.map((c)=>c.name));
  tasks=(Array.isArray(data.tasks)?data.tasks:[]).map((t,i)=>({
    id:typeof t.id==='number'?t.id:createTaskId(),
    content:typeof t.content==='string'?t.content:'',
    completed:Boolean(t.completed),
    categories:Array.isArray(t.categories)?t.categories.filter((n)=>names.has(n)):[],
    order:Number.isFinite(t.order)?t.order:i,
    dueDate:typeof t.dueDate==='string'?t.dueDate:'',
    createdAt:Number.isFinite(t.createdAt)?t.createdAt:Date.now(),
    updatedAt:Number.isFinite(t.updatedAt)?t.updatedAt:Date.now()
  }));
  tasks.sort((a,b)=>a.order-b.order);
}

function createTaskId(){return Date.now()+Math.floor(Math.random()*1000000);}

function getCategoryColor(name){
  let hash=0;for(let i=0;i<name.length;i+=1){hash=((hash<<5)-hash)+name.charCodeAt(i);hash|=0;}
  return `hsl(${Math.abs(hash)%360}, 70%, 60%)`;
}

function renderAll(){
  el.totalCount.textContent=String(tasks.length);
  el.todayCn.textContent=`今天 · ${formatDateCn(toDateInputValue(new Date()))}`;
  renderCategories();
  renderTasks();
}

function getCategoryCounts(){const m=new Map(categories.map((c)=>[c.name,0]));tasks.forEach((t)=>t.categories.forEach((n)=>m.set(n,(m.get(n)||0)+1)));return m;}

function renderCategories(){
  const counts=getCategoryCounts();
  el.categoriesList.innerHTML='';
  categories.forEach((c)=>{
    const row=document.createElement('div');
    row.className='category-item';
    row.innerHTML=`<div class="category-main"><input type="checkbox" data-category-checkbox="${escAttr(c.name)}" ${state.selectedCategories.includes(c.name)?'checked':''}><span class="category-chip" style="background:${c.color}"></span><span class="category-name">${esc(c.name)}</span><span class="category-count">${counts.get(c.name)||0}</span></div><button class="icon-btn" data-delete-category="${escAttr(c.name)}" title="删除分类">🗑</button>`;
    el.categoriesList.appendChild(row);
  });
  el.categoriesList.querySelectorAll('[data-category-checkbox]').forEach((box)=>{
    box.addEventListener('change',()=>{const name=box.getAttribute('data-category-checkbox');if(box.checked){if(!state.selectedCategories.includes(name))state.selectedCategories.push(name);}else{state.selectedCategories=state.selectedCategories.filter((n)=>n!==name);}renderTasks();});
  });
  el.categoriesList.querySelectorAll('[data-delete-category]').forEach((btn)=>btn.addEventListener('click',async()=>deleteCategory(btn.getAttribute('data-delete-category'))));
}

function filteredTasks(){
  let list=[...tasks];
  if(state.selectedCategories.length)list=list.filter((t)=>t.categories.some((n)=>state.selectedCategories.includes(n)));
  if(state.statusFilter==='incomplete')list=list.filter((t)=>!t.completed);
  if(state.statusFilter==='completed')list=list.filter((t)=>t.completed);
  return list;
}

function renderTasks(){
  const list=filteredTasks();
  if(!list.length){el.taskList.innerHTML='<div class="empty">当前筛选下暂无任务</div>';initSortable();return;}
  el.taskList.innerHTML='';
  list.forEach((t,index)=>{
    const node=document.createElement('article');
    node.className='task-item';
    node.style.animationDelay=`${index*40}ms`;
    node.setAttribute('data-task-id',String(t.id));
    node.setAttribute('data-glass-item','1');
    const tags=t.categories.map((n)=>{const c=categories.find((x)=>x.name===n);return `<span class="tag" style="background:${c?c.color:getCategoryColor(n)}">${esc(n)}</span>`;}).join('');
    node.innerHTML=`<input class="task-checkbox" type="checkbox" ${t.completed?'checked':''}><div class="task-content"><div class="task-text ${t.completed?'completed':''}">${esc(t.content)}</div><div class="task-meta-row"><span class="task-date">${t.dueDate?`截止：${formatDateCn(t.dueDate)}`:'未设截止日期'}</span></div><div class="task-tags">${tags}</div></div><div class="task-actions"><button class="task-action-btn" data-edit-task="${t.id}" title="编辑">✏</button><button class="task-action-btn delete" data-delete-task="${t.id}" title="删除">🗑</button></div>`;
    el.taskList.appendChild(node);
  });
  el.taskList.querySelectorAll('.task-checkbox').forEach((box)=>box.addEventListener('change',async()=>{const id=Number(box.closest('.task-item').getAttribute('data-task-id'));const task=tasks.find((x)=>x.id===id);if(!task)return;task.completed=!task.completed;task.updatedAt=Date.now();await persist();renderAll();}));
  el.taskList.querySelectorAll('[data-delete-task]').forEach((btn)=>btn.addEventListener('click',async()=>deleteTask(Number(btn.getAttribute('data-delete-task')))));
  el.taskList.querySelectorAll('[data-edit-task]').forEach((btn)=>btn.addEventListener('click',()=>openEditTask(Number(btn.getAttribute('data-edit-task')))));
  el.taskList.querySelectorAll('.task-text').forEach((txt)=>txt.addEventListener('dblclick',()=>openEditTask(Number(txt.closest('.task-item').getAttribute('data-task-id')))));
  initSortable();
}

function initSortable(){
  if(sortable)sortable.destroy();
  sortable=new Sortable(el.taskList,{animation:220,draggable:'.task-item',ghostClass:'sortable-ghost',chosenClass:'sortable-chosen',onEnd:async()=>reorderVisibleTasks()});
}

async function reorderVisibleTasks(){
  const ids=Array.from(el.taskList.querySelectorAll('.task-item')).map((n)=>Number(n.getAttribute('data-task-id')));
  if(!ids.length)return;
  const all=[...tasks].sort((a,b)=>a.order-b.order);
  const pos=[];all.forEach((t,i)=>ids.includes(t.id)&&pos.push(i));
  const visible=ids.map((id)=>tasks.find((t)=>t.id===id)).filter(Boolean);
  pos.forEach((p,i)=>{all[p]=visible[i];});
  const now=Date.now();all.forEach((t,i)=>{t.order=i;t.updatedAt=now;});
  tasks=all;await persist();renderTasks();
}

function beginAddTask(){
  const content=el.taskInput.value.trim();
  state.mode='add';
  state.editingTaskId=null;
  openTaskModal('添加任务',content,[], '');
}

function openEditTask(taskId){
  const task=tasks.find((t)=>t.id===taskId);
  if(!task)return;
  state.mode='edit';
  state.editingTaskId=task.id;
  openTaskModal('编辑任务',task.content,task.categories,task.dueDate||'');
}

function openTaskModal(title,content,selected,dueDate=''){
  el.taskModalTitle.textContent=title;
  el.taskModalInput.value=content;
  el.taskModalDate.value=dueDate;
  el.taskModalDateCn.textContent=formatDateCn(dueDate);
  el.taskModalCategories.innerHTML='';
  categories.forEach((c)=>{const tag=document.createElement('label');tag.className='modal-category-option';tag.innerHTML=`<input type="checkbox" value="${escAttr(c.name)}" ${selected.includes(c.name)?'checked':''}><span>${esc(c.name)}</span>`;el.taskModalCategories.appendChild(tag);});
  el.taskModal.classList.remove('hidden');
  const card=el.taskModal.querySelector('.modal-card');
  card.classList.remove('sheet-out');
  card.classList.add('sheet-in');
  setTimeout(()=>el.taskModalInput.focus(),0);
}

function closeTaskModal(){
  const card=el.taskModal.querySelector('.modal-card');
  card.classList.remove('sheet-in');
  card.classList.add('sheet-out');
  setTimeout(()=>el.taskModal.classList.add('hidden'),160);
}

async function submitTaskModal(){
  const content=el.taskModalInput.value.trim();
  if(!content)return window.alert('任务内容不能为空');
  const selected=Array.from(el.taskModalCategories.querySelectorAll('input:checked')).map((x)=>x.value);
  const dueDate=el.taskModalDate.value||'';
  const now=Date.now();
  if(state.mode==='add'){
    const order=tasks.length?Math.max(...tasks.map((t)=>t.order))+1:0;
    tasks.push({id:createTaskId(),content,completed:false,categories:selected,dueDate,order,createdAt:now,updatedAt:now});
    el.taskInput.value='';
  }else{
    const task=tasks.find((t)=>t.id===state.editingTaskId);
    if(!task)return;
    task.content=content;task.categories=selected;task.dueDate=dueDate;task.updatedAt=now;
  }
  closeTaskModal();await persist();renderAll();
}

function openCategoryModal(){
  el.categoryNameInput.value='';
  el.categoryModal.classList.remove('hidden');
  const card=el.categoryModal.querySelector('.modal-card');
  card.classList.remove('sheet-out');
  card.classList.add('sheet-in');
  setTimeout(()=>el.categoryNameInput.focus(),0);
}
function closeCategoryModal(){
  const card=el.categoryModal.querySelector('.modal-card');
  card.classList.remove('sheet-in');
  card.classList.add('sheet-out');
  setTimeout(()=>el.categoryModal.classList.add('hidden'),160);
}

async function submitCategoryModal(){
  const name=el.categoryNameInput.value.trim();
  if(!name)return window.alert('分类名称不能为空');
  if(categories.some((c)=>c.name===name))return window.alert('分类名称已存在');
  categories.push({name,color:getCategoryColor(name)});
  closeCategoryModal();
  await persist();
  renderCategories();
}

async function deleteCategory(name){
  if(!window.confirm(`确认删除分类“${name}”？\n该分类会从所有任务中移除。`))return;
  categories=categories.filter((c)=>c.name!==name);
  state.selectedCategories=state.selectedCategories.filter((n)=>n!==name);
  const now=Date.now();tasks.forEach((t)=>{t.categories=t.categories.filter((n)=>n!==name);t.updatedAt=now;});
  await persist();renderAll();
}

async function deleteTask(taskId){
  if(!window.confirm('确定删除该任务吗？'))return;
  tasks=tasks.filter((t)=>t.id!==taskId);
  tasks.forEach((t,i)=>{t.order=i;});
  await persist();renderAll();
}

async function persist(){tasks.sort((a,b)=>a.order-b.order);await window.electronAPI.saveData({tasks,categories});}

function setupCustomMenu(){
  let active='';
  const closeAll=()=>{el.menuPanels.forEach((p)=>p.classList.remove('open'));el.menuRoots.forEach((r)=>r.classList.remove('active'));active='';};
  el.menuRoots.forEach((btn)=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const key=btn.dataset.menu;
      if(active===key){closeAll();return;}
      closeAll();
      active=key;
      btn.classList.add('active');
      const panel=document.querySelector(`.menu-panel[data-panel="${key}"]`);
      if(!panel)return;
      const rect=btn.getBoundingClientRect();
      panel.style.left=`${rect.left}px`;
      panel.style.top=`${rect.bottom+8}px`;
      panel.classList.add('open');
    });
  });

  el.menuItems.forEach((item)=>{
    item.addEventListener('click',async()=>{
      const cmd=item.dataset.command;
      await handleMenuCommand(cmd);
      closeAll();
    });
  });

  document.addEventListener('click',()=>closeAll());
}

async function handleMenuCommand(cmd){
  if(cmd==='new-task'){beginAddTask();return;}
  if(cmd==='focus-input'){el.taskInput.focus();return;}
  if(cmd==='about'){window.alert('待办清单\n液态玻璃风格桌面版');return;}
  await window.electronAPI.menuCommand(cmd);
}

function setupGlassInteractions(){
  const reactiveSelectors='.task-item,.category-item,.task-count-card,.today-chip,.modal-card,.composer';
  document.addEventListener('pointermove',(e)=>{
    document.querySelectorAll(reactiveSelectors).forEach((card)=>{
      const rect=card.getBoundingClientRect();
      if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){
        card.style.setProperty('--mx','50%');
        card.style.setProperty('--my','50%');
        return;
      }
      const x=((e.clientX-rect.left)/rect.width)*100;
      const y=((e.clientY-rect.top)/rect.height)*100;
      card.style.setProperty('--mx',`${x}%`);
      card.style.setProperty('--my',`${y}%`);
    });
  });
  document.addEventListener('pointerdown',(e)=>{
    const target=e.target.closest('.task-item,.primary-btn,.ghost-btn,.task-action-btn,.category-item');
    if(target)target.classList.add('pressing');
  });
  document.addEventListener('pointerup',()=>{
    document.querySelectorAll('.pressing').forEach((n)=>n.classList.remove('pressing'));
  });
}

function toDateInputValue(date){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
function formatDateCn(v){if(!v)return '';const [y,m,d]=v.split('-');if(!y||!m||!d)return '';return `${Number(y)}年${Number(m)}月${Number(d)}日`;}
function esc(text){const div=document.createElement('div');div.textContent=text;return div.innerHTML;}
function escAttr(text){return String(text).replace(/"/g,'&quot;');}
