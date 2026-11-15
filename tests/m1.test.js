/* M1：首页总览 + 今日计划 */
TRESET();

T('首页添加计划后，计划页可见且进度分母为 1', function(){
  TFILL('#homePlan', '买牛奶');
  TCLICK('[data-act="home-plan"]');
  TA(db.plans.length === 1, '条数=' + db.plans.length);
  TA(TTEXT().indexOf('0/1 已完成') > -1, '首页进度未更新');
  route = 'plan'; planDate = todayStr(); render();
  TA(TTEXT().indexOf('买牛奶') > -1, '计划页看不到该任务');
  TA(TTEXT().indexOf('0/1 完成') > -1, '计划页进度分母不对');
});

T('勾选完成：数据、首页进度、计划页勾选框三处一致', function(){
  route = 'home'; render();
  TCLICK('[data-act="plan-toggle"]');
  TA(db.plans[0].done === true, '数据未置完成');
  TA(TTEXT().indexOf('1/1 已完成') > -1, '首页进度未更新');
  route = 'plan'; render();
  TA(TQ('.check').classList.contains('on'), '计划页未同步勾选态');
});

T('推迟把任务移到第二天，当天列表不再包含', function(){
  route = 'plan'; planDate = todayStr(); render();
  var id = TQ('[data-act="plan-later"]').dataset.id;
  TCLICK('[data-act="plan-later"]');
  var p = db.plans.filter(function(x){ return x.id === id; })[0];
  TA(p.date === shift(todayStr(), 1), '日期=' + p.date);
  TA(TTEXT().indexOf('买牛奶') === -1, '当天列表仍显示该任务');
  planDate = shift(todayStr(), 1); render();
  TA(TTEXT().indexOf('买牛奶') > -1, '次日列表看不到该任务');
});

T('时间段与优先级正确落位，并按时间段排序', function(){
  TRESET();
  route = 'plan'; planDate = todayStr(); render();
  TFILL('#planText', '晚上跑步'); TSET('#planSlot', '晚上'); TSET('#planPrio', 'low');
  TCLICK('[data-act="plan-add"]');
  TFILL('#planText', '早上写作'); TSET('#planSlot', '早上'); TSET('#planPrio', 'high');
  TCLICK('[data-act="plan-add"]');
  TA(db.plans.length === 2, '条数=' + db.plans.length);
  var morning = db.plans.filter(function(p){ return p.slot === '早上'; })[0];
  TA(morning.priority === 'high', '优先级未落位');
  var html = TTEXT();
  TA(html.indexOf('早上写作') < html.indexOf('晚上跑步'), '未按时间段排序');
});

T('日期切换：前一天/今天/后一天按钮生效', function(){
  route = 'plan'; planDate = todayStr(); render();
  TCLICK('[data-act="plan-shift"][data-n="-1"]');
  TA(planDate === shift(todayStr(), -1), '前一天失败：' + planDate);
  TCLICK('[data-act="plan-today"]');
  TA(planDate === todayStr(), '回到今天失败');
  TCLICK('[data-act="plan-shift"][data-n="1"]');
  TA(planDate === shift(todayStr(), 1), '后一天失败');
  planDate = todayStr();
});

T('备忘：回车添加、删除生效、超过 300 条自动截断', function(){
  TRESET();
  route = 'home'; render();
  TFILL('#memoInput', '记一下');
  TENTER('#memoInput');
  TA(db.memos.length === 1, '回车未添加');
  TA(TTEXT().indexOf('记一下') > -1, '备忘未显示');
  TCLICK('[data-act="memo-del"]');
  TA(db.memos.length === 0, '删除失败');

  var arr = [];
  for(var i = 0; i < 300; i++) arr.push({ id:'m'+i, text:'旧备忘'+i, ts: Date.now() });
  db.memos = arr; save(); render();
  TFILL('#memoInput', '第 301 条');
  TCLICK('[data-act="memo-add"]');
  TA(db.memos.length === 300, '未截断，实际=' + db.memos.length);
  TA(db.memos[0].text === '第 301 条', '新备忘不在最前');
});

T('六张摘要卡数字与各模块数据一致', function(){
  TRESET();
  db.contents.push({ id:'c1', title:'选题A', platform:'小红书', planDate:'', stage:'选题', body:'', created:1 });
  db.projects.push({ id:'p1', name:'项目A', desc:'', status:'进行中', tasks:[], issues:[{id:'i1', text:'bug', resolved:false}] });
  db.consults.push({ id:'s1', who:'张先生', topic:'规划', date: todayStr(), status:'待跟进', followUp: todayStr(), summary:'' });
  db.fitness.logs.push({ id:'f1', date: todayStr(), note:'' });
  db.food.items.push({ id:'o1', date: todayStr(), slot:'早餐', text:'鸡蛋' });
  db.games.push({ id:'g1', name:'哈迪斯', status:'在玩' });
  db.plays.push({ id:'y1', gameId:'g1', date: todayStr(), minutes: 90 });
  save();
  route = 'home'; render();
  var kpis = TALL('.kpi');
  TA(kpis.length === 6, '摘要卡数量=' + kpis.length);
  var nums = [];
  kpis.forEach(function(k){ nums.push(k.querySelector('.k-num').textContent); });
  TA(nums[0] === '1', '自媒体待完成=' + nums[0]);
  TA(nums[1] === '1', '进行中项目=' + nums[1]);
  TA(nums[2] === '1', '待跟进=' + nums[2]);
  TA(nums[3] === '已练', '健身状态=' + nums[3]);
  TA(nums[4] === '1', '饮食条数=' + nums[4]);
  TA(nums[5] === '1.5h', '游戏时长=' + nums[5]);
  TA(kpis[1].querySelector('.k-sub').textContent.indexOf('未解决问题 1 个') > -1, '未解决问题数不对');
});

T('摘要卡整卡可点击跳转对应模块', function(){
  route = 'home'; render();
  TCLICK('.kpi[data-route="food"]');
  TA(route === 'food', 'route=' + route);
  TA(TQ('.navitem.on').textContent.indexOf('饮食') > -1, '侧边栏未高亮饮食');
});

TDONE();
