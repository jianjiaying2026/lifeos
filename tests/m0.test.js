/* M0：骨架、数据层、通用工具、弹窗 */
TRESET();

T('九个路由逐一渲染，无异常', function(){
  ['home','plan','selfmedia','dev','consult','fitness','food','game','settings'].forEach(function(r){
    route = r; render();
    TA(document.getElementById('main').innerHTML.length > 200, r + ' 渲染为空');
  });
});

T('导航 9 项且当前项高亮唯一', function(){
  route = 'consult'; render();
  TA(TALL('.navitem').length === 9, '导航项数量=' + TALL('.navitem').length);
  TA(TALL('.navitem.on').length === 1, '高亮项数量=' + TALL('.navitem.on').length);
  TA(TQ('.navitem.on').textContent.indexOf('咨询') > -1, '高亮项不对');
});

T('normalize 能把空对象补成完整结构', function(){
  var d = normalize({});
  ['plans','memos','ideas','contents','metrics','projects','consults','games','plays'].forEach(function(k){
    TA(Array.isArray(d[k]), k + ' 不是数组');
  });
  TA(d.fitness && typeof d.fitness.week['1'] === 'string', 'fitness.week 缺失');
  TA(Array.isArray(d.fitness.logs), 'fitness.logs 缺失');
  TA(Array.isArray(d.food.items), 'food.items 缺失');
  TA(d.version === 1, 'version 未补齐');
});

T('normalize 能修复错误类型（脏数据自动重置）', function(){
  var d = normalize({ version: 1, plans: 'oops', projects: [{ id:'p1', name:'x' }], fitness: { week: null } });
  TA(Array.isArray(d.plans) && d.plans.length === 0, 'plans 未被重置');
  TA(Array.isArray(d.projects[0].tasks), '项目 tasks 未补齐');
  TA(Array.isArray(d.projects[0].issues), '项目 issues 未补齐');
  TA(d.fitness.week['7'] === '', 'week 未补齐');
});

T('localStorage 损坏时 load() 回退空库而不抛错', function(){
  localStorage.setItem(KEY, '{这不是合法 json');
  var d = load();
  TA(Array.isArray(d.plans) && d.plans.length === 0, '未回退空库');
  localStorage.removeItem(KEY);
});

T('esc 转义 HTML 危险字符', function(){
  TA(esc('<b>"x" & \'y\'') === '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;', '转义结果=' + esc('<b>"x"'));
});

T('日期工具跨月跨年正确', function(){
  TA(shift('2026-01-01', -1) === '2025-12-31', '跨年错误：' + shift('2026-01-01', -1));
  TA(shift('2026-02-28', 1) === '2026-03-01', '跨月错误：' + shift('2026-02-28', 1));
  TA(weekName('2026-11-15') === '周日', '星期计算错误');
});

T('weekRange 以周一为起点、周日为终点', function(){
  var r = weekRange();
  TA(weekdayNum(r[0]) === 1, '起点不是周一：' + r[0]);
  TA(weekdayNum(r[1]) === 7, '终点不是周日：' + r[1]);
  TA(shift(r[0], 6) === r[1], '跨度不是 7 天');
});

T('弹窗可打开、Esc 关闭、onSave 返回 false 时保持打开', function(){
  openModal({ title: '测试弹窗', body: '<div>内容</div>', onSave: function(){ return false; } });
  TA(TQ('.overlay'), '弹窗未打开');
  TCLICK('#modalSave');
  TA(TQ('.overlay'), 'onSave 返回 false 时弹窗被关闭了');
  document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
  TA(!document.querySelector('.overlay'), 'Esc 未关闭弹窗');
});

T('save() 写入后回读一致（存储自检）', function(){
  db.plans.push({ id:'x', date: todayStr(), text:'自检', slot:'未定', priority:'mid', done:false });
  save();
  TA(localStorage.getItem(KEY) === JSON.stringify(db), '回读内容与内存不一致');
  TA(lastAlert === '', '正常写入却触发了告警：' + lastAlert);
});

TDONE();
