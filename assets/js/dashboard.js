/* =========================
   GOOGLE CALENDAR CONFIG
   1) Tạo OAuth Client ID dạng Web application trong Google Cloud.
   2) Thêm domain hiện tại vào Authorized JavaScript origins.
   3) Bật Google Calendar API.
   4) Dán Client ID vào phần "Cấu hình Google Calendar".
========================= */
const GOOGLE_CLIENT_ID = window.DASHBOARD_CONFIG?.googleClientId || "";
const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/tasks.readonly";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest", "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"];
let tokenClient = null, gapiReady = false, gisReady = false;
let currentMonth = new Date(); currentMonth.setDate(1);
const $ = id => document.getElementById(id);
const dateFmt = new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit'});
const weekdayFmt = new Intl.DateTimeFormat('vi-VN',{weekday:'long'});
const monthFmt = new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'});
const today = new Date(); today.setHours(0,0,0,0);

function setTodayHeader(){
  $('weekdayLabel').textContent = weekdayFmt.format(new Date()).toLocaleUpperCase('vi-VN');
  $('dateLabel').textContent = new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
}
function weatherInfo(code){
  if(code===0)return ['Trời quang','☀️'];
  if([1,2].includes(code))return ['Ít mây','🌤️'];
  if(code===3)return ['Nhiều mây','☁️'];
  if([45,48].includes(code))return ['Sương mù','🌫️'];
  if([51,53,55,56,57].includes(code))return ['Mưa phùn','🌦️'];
  if([61,63,65,66,67,80,81,82].includes(code))return ['Mưa','🌧️'];
  if([71,73,75,77,85,86].includes(code))return ['Tuyết','🌨️'];
  if([95,96,99].includes(code))return ['Dông','⛈️'];
  return ['Thời tiết biến đổi','🌤️'];
}
let weatherLocation = {lat:21.0285,lon:105.8542,place:'Hà Nội'};
async function loadWeather(lat,lon,place){
  $('weatherPlace').textContent='• '+place;
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto`;
  try{
    const r=await fetch(url); if(!r.ok)throw new Error('Không lấy được dữ liệu thời tiết');
    const d=await r.json();
    for(let i=0;i<3;i++){
      const [desc,icon]=weatherInfo(d.daily.weather_code[i]);
      const high=Math.round(d.daily.temperature_2m_max[i]),low=Math.round(d.daily.temperature_2m_min[i]);
      const rain=d.daily.precipitation_probability_max?.[i] ?? '--';
      if(i===0){
        $('todayHigh').textContent=high;$('todayLow').textContent=low;$('todayDesc').textContent=desc;
        $('todayIcon').textContent=icon;$('todayRain').textContent=`💧 ${rain}% khả năng mưa`;
      }else{
        const n=i;
        $(`day${n}Name`).textContent=new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(new Date(d.daily.time[i]+'T12:00:00'));
        $(`day${n}Date`).textContent=dateFmt.format(new Date(d.daily.time[i]+'T12:00:00'));
        $(`day${n}High`).textContent=high;$(`day${n}Low`).textContent=low;
        $(`day${n}Desc`).textContent=desc;$(`day${n}Icon`).textContent=icon;$(`day${n}Rain`).textContent=`💧 ${rain}%`;
      }
    }
  }catch(e){$('todayDesc').textContent='Không thể tải thời tiết';$('weatherPlace').textContent='• '+place;}
}
function initWeather(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      p=>{weatherLocation={lat:p.coords.latitude,lon:p.coords.longitude,place:'Vị trí của bạn'};loadWeather(weatherLocation.lat,weatherLocation.lon,weatherLocation.place)},
      ()=>loadWeather(weatherLocation.lat,weatherLocation.lon,weatherLocation.place),
      {timeout:7000,maximumAge:600000}
    );
  }else loadWeather(weatherLocation.lat,weatherLocation.lon,weatherLocation.place);
}
function renderCalendar(){
  $('monthTitle').textContent=monthFmt.format(currentMonth).replace(/^./,c=>c.toLocaleUpperCase('vi-VN'));
  const grid=$('calendarGrid');grid.innerHTML='';
  ['T2','T3','T4','T5','T6','T7','CN'].forEach(x=>{const el=document.createElement('div');el.className='weekday';el.textContent=x;grid.appendChild(el)});
  const year=currentMonth.getFullYear(),month=currentMonth.getMonth();
  const first=new Date(year,month,1),offset=(first.getDay()+6)%7;
  const start=new Date(year,month,1-offset);
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const el=document.createElement('div');el.className='day-cell';el.textContent=d.getDate();
    if(d.getMonth()!==month)el.classList.add('muted');
    if(d.getTime()===today.getTime())el.classList.add('today');
    grid.appendChild(el);
  }
}
$('prevMonth').onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};
$('nextMonth').onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};

function loadGoogleScripts(){
  const check=()=>{
    if(window.gapi&&!gapiReady){gapi.load('client',async()=>{try{await gapi.client.init({discoveryDocs:DISCOVERY_DOCS});gapiReady=true}catch(e){console.error(e)}})}
    if(window.google?.accounts?.oauth2)gisReady=true;
  };
  const timer=setInterval(()=>{check();if(gapiReady&&gisReady)clearInterval(timer)},300);
}
function connectCalendar(){
  const clientId=GOOGLE_CLIENT_ID;
  if(!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')){$('message').textContent='Hãy cấu hình Google Client ID trong _config.yml rồi triển khai lại.';return;}
  if(!gapiReady||!window.google?.accounts?.oauth2){$('message').textContent='Google API đang khởi tạo, vui lòng thử lại sau vài giây.';loadGoogleScripts();return}
  tokenClient=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPES,callback:async(resp)=>{
    if(resp.error){$('message').textContent='Đăng nhập không thành công: '+resp.error;return}
    $('calendarStatus').textContent='Đã kết nối';
    $('connectBtn').textContent='Làm mới lịch';
    await fetchCalendarEvents();
     scheduleCalendarRefresh();
  }});
  tokenClient.requestAccessToken({prompt:'consent'});
}
function monthRange(){
  const now=new Date();
  return {start:new Date(now.getFullYear(),now.getMonth(),1),end:new Date(now.getFullYear(),now.getMonth()+2,1)};
}
function shortWeekday(date){
  return ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][date.getDay()];
}
function localDateFromEvent(ev){
  const raw=ev.start.dateTime||ev.start.date;
  if(ev.start.dateTime)return new Date(ev.start.dateTime);
  const [y,m,d]=raw.split('-').map(Number);
  return new Date(y,m-1,d);
}
function renderEventList(items){
  const list=$('taskList');list.innerHTML='';
  if(!items.length){list.innerHTML='<div class="empty">Không có sự kiện hoặc việc cần làm trong tháng này và tháng sau.</div>';return;}
  const groups=new Map();
  const addItem=(date,item)=>{
    const monthKey=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    if(!groups.has(monthKey))groups.set(monthKey,{date:new Date(date.getFullYear(),date.getMonth(),1),days:new Map()});
    const group=groups.get(monthKey),dayKey=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if(!group.days.has(dayKey))group.days.set(dayKey,{date,items:[]});
    group.days.get(dayKey).items.push(item);
  };
  const undated=[];
  items.forEach(item=>item.date?addItem(item.date,item):undated.push(item));
  const renderRow=(item)=>{
    const row=document.createElement('div');row.className='task-row';
    const pill=document.createElement('div');pill.className='task-pill '+(item.kind==='todo'?'todo':'event');
    const wrap=document.createElement('div');wrap.className='task-name-wrap';
    const name=document.createElement('div');name.className='task-name';name.textContent=item.title||'(Không có tiêu đề)';
    wrap.appendChild(name);
    if(item.time){const time=document.createElement('div');time.className='task-time';time.textContent=item.time;wrap.appendChild(time);}
    pill.append(wrap);row.append(pill);return row;
  };
  for(const group of [...groups.values()].sort((a,b)=>a.date-b.date)){
    const month=document.createElement('div');month.className='event-month';month.textContent=`Tháng ${group.date.getMonth()+1}`;list.appendChild(month);
    const days=[...group.days.values()].sort((a,b)=>a.date-b.date);
    for(const day of days){
      const dayWrap=document.createElement('div');dayWrap.className='event-day';
      const dateCol=document.createElement('div');dateCol.className='event-date-col';
      const weekday=document.createElement('div');weekday.className='event-weekday';weekday.textContent=shortWeekday(day.date);
      const dateLabel=document.createElement('div');dateLabel.className='task-date';dateLabel.textContent=String(day.date.getDate()).padStart(2,'0');
      dateCol.append(weekday,dateLabel);
      const eventItems=document.createElement('div');eventItems.className='event-items';
      day.items.sort((a,b)=>(a.sortTime||0)-(b.sortTime||0));
      day.items.forEach(item=>eventItems.appendChild(renderRow(item)));
      dayWrap.append(dateCol,eventItems);list.appendChild(dayWrap);
    }
  }
  if(undated.length){
    const heading=document.createElement('div');heading.className='event-month';heading.textContent='Chưa đặt ngày';list.appendChild(heading);
    undated.forEach(item=>list.appendChild(renderRow(item)));
  }
}
async function fetchCalendarEvents(){
  $('connectBtn').disabled=true;$('calendarStatus').textContent='Đang tải…';
  try{
    const {start,end}=monthRange();let items=[],pageToken;
    do{
      const res=await gapi.client.calendar.events.list({calendarId:'primary',timeMin:start.toISOString(),timeMax:end.toISOString(),singleEvents:true,orderBy:'startTime',maxResults:2500,pageToken});
      (res.result.items||[]).forEach(ev=>{
        const date=localDateFromEvent(ev),allDay=!ev.start.dateTime;
        const fmt=value=>new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
        items.push({kind:'event',title:ev.summary||'(Không có tiêu đề)',date,time:allDay?'Cả ngày':`${fmt(ev.start.dateTime)}${ev.end?.dateTime?' – '+fmt(ev.end.dateTime):''}`,sortTime:allDay?0:new Date(ev.start.dateTime).getTime()});
      });
      pageToken=res.result.nextPageToken;
    }while(pageToken);

    // Google Tasks is a separate API from Calendar Events. Include tasks due in the date range,
    // plus tasks without a due date so they are not silently omitted.
    let taskCount=0;
    const listsRes=await gapi.client.tasks.tasklists.list({maxResults:100});
    for(const taskList of (listsRes.result.items||[])){
      let taskPage;
      do{
        const taskRes=await gapi.client.tasks.tasks.list({tasklist:taskList.id,maxResults:100,showCompleted:true,pageToken:taskPage});
        for(const task of (taskRes.result.items||[])){
          if(task.status==='deleted')continue;
          let date=null;
          if(task.due){const d=new Date(task.due);date=new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
          if(date && (date<start || date>=end))continue;
          const completed=task.status==='completed';
          items.push({kind:'todo',title:task.title||'(Việc chưa có tên)',date,time:completed?'Đã hoàn thành':(taskList.title||'Việc cần làm'),completed,sortTime:date?date.getTime():Number.MAX_SAFE_INTEGER});
          taskCount++;
        }
        taskPage=taskRes.result.nextPageToken;
      }while(taskPage);
    }
    renderEventList(items);
    const eventCount=items.filter(x=>x.kind==='event').length;
    $('calendarStatus').textContent=`${eventCount} sự kiện · ${taskCount} việc cần làm`;
    $('message').textContent='Lịch tự cập nhật mỗi 3 giờ; thời tiết mỗi 30 phút.';
  }catch(e){
    $('calendarStatus').textContent='Lỗi tải dữ liệu';
    $('message').textContent='Không đọc được lịch hoặc việc cần làm. Hãy kiểm tra Google Calendar API, Google Tasks API và OAuth Client ID.';
    console.error(e);
  }finally{$('connectBtn').disabled=false}
}
function scheduleCalendarRefresh(){
  if(window.calendarRefreshTimer)clearInterval(window.calendarRefreshTimer);
  window.calendarRefreshTimer=setInterval(()=>{
    if(tokenClient){
      tokenClient.callback=async(resp)=>{
        if(resp.error){$('calendarStatus').textContent='Cần kết nối lại';$('message').textContent='Phiên Google hết hạn. Nhấn “Kết nối Google Calendar” để tiếp tục cập nhật.';return;}
        await fetchCalendarEvents();
      };
      tokenClient.requestAccessToken({prompt:''});
    }
  },3*60*60*1000);
}
$('connectBtn').onclick=connectCalendar;
setTodayHeader();renderCalendar();initWeather();loadGoogleScripts();
setInterval(()=>loadWeather(weatherLocation.lat,weatherLocation.lon,weatherLocation.place),30*60*1000);
