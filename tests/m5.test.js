/* M5：数据与设置、备份恢复、边界与稳健性 */
TRESET();

function seedAll(){
  db.plans = [{ id:'p1', date: todayStr(), text:'写稿', slot:'上午', priority:'high', done:false }];
  db.memos = [{ id:'n1', text:'备忘一条', ts: Date.now() }];
  db.ideas = [{ id:'i1', text:'灵感一条', tags:'a', ts: Date.now(), used:false }];
  db.contents = [{ id:'c1', title:'内容一条', platform:'小红书', planDate:'', stage:'已发布', body:'正文', created:1 }];
  db.metrics = [{ id:'m1', contentId:'c1', date: todayStr(), views: 100, likes: 5, note:'' }];
  db.projects = [{ id:'d1', name:'项目一', desc:'', status:'进行中',
                   tasks:[{id:'t1',text:'任务',done:false}], issues:[{id:'b1',text:'bug',resolved:false}] }];
  db.consults = [{ id:'s1', who:'张先生', topic:'规划', date: todayStr(), status:'待跟进', followUp: todayStr(), summary:'' }];
  db.fitness.week['1'] = '胸';
  db.fitness.logs = [{ id:'f1', date: todayStr(), note:'胸' }];
  db.food.items = [{ id:'o1', date: todayStr(), slot:'早餐', text:'鸡蛋' }];
  db.games = [{ id:'g1', name:'哈迪斯', status:'在玩' }];
  db.plays = [{ id:'y1', gameId:'g1', date: todayStr(), minutes: 45 }];
  save();
}

T('数据概况：11 项计数与各模块实际条数一致', function(){
  seedAll();
  route = 'settings'; render();
  var labels = ['计划','备忘','灵感','内容','数据记录','项目','咨询','健身打卡','饮食记录','游戏','游戏时长记录'];
  var expect = [db.plans.length, db.memos.length, db.ideas.length, db.contents.length, db.metrics.length,
                db.projects.length, db.consults.length, db.fitness.logs.length, db.food.items.length,
                db.games.length, db.plays.length];
  var rows = TALL('#main .card .list .item');
  var found = 0;
  rows.forEach(function(row){
    var name = row.querySelector('.t').textContent.trim();
    var num = parseInt(row.querySelector('.xs').textContent.trim(), 10);
    var idx = labels.indexOf(name);
    if(idx > -1){
      found++;
      TA(num === expect[idx], name + ' 计数=' + num + ' 期望 ' + expect[idx]);
    }
  });
  TA(found === 11, '只匹配到 ' + found + ' 项统计');
});

T('导出：生成合法 JSON，含 version 与全部模块字段', function(){
  var json = JSON.stringify(db, null, 2);
  var parsed = JSON.parse(json);
  TA(parsed.version === 1, 'version=' + parsed.version);
  ['plans','memos','ideas','contents','metrics','projects','consults','fitness','food','games','plays']
    .forEach(function(k){ TA(k in parsed, '缺少字段 ' + k); });
  exportData();
  TA(lastAlert === '', '导出触发了告警：' + lastAlert);
});

T('HTML 注入被转义，不生成元素、不执行脚本', function(){
  route = 'plan'; planDate = todayStr(); render();
  TFILL('#planText', '<img src=x onerror="window.__xss=1">');
  TCLICK('[data-act="plan-add"]');
  TA(TTEXT().indexOf('&lt;img') > -1, '未转义');
  TA(TALL('#main img').length === 0, '生成了 img 元素');
  TA(typeof window.__xss === 'undefined', '脚本被执行');
});

T('空输入不产生任何记录', function(){
  var before = db.plans.length;
  TFILL('#planText', '    ');
  TCLICK('[data-act="plan-add"]');
  TA(db.plans.length === before, '空计划被添加');

  route = 'home'; render();
  var memos = db.memos.length;
  TFILL('#memoInput', '  ');
  TCLICK('[data-act="memo-add"]');
  TA(db.memos.length === memos, '空备忘被添加');

  route = 'selfmedia'; smTab = 'idea'; render();
  var ideas = db.ideas.length;
  TFILL('#ideaText', ' ');
  TCLICK('[data-act="idea-add"]');
  TA(db.ideas.length === ideas, '空灵感被添加');

  route = 'dev'; devOpen = 'd1'; render();
  var tasks = db.projects[0].tasks.length;
  TFILL('#devTaskInput', ' ');
  TCLICK('[data-act="dev-task-add"]');
  TA(db.projects[0].tasks.length === tasks, '空任务被添加');
  var issues = db.projects[0].issues.length;
  TFILL('#devIssueInput', ' ');
  TCLICK('[data-act="dev-issue-add"]');
  TA(db.projects[0].issues.length === issues, '空问题被添加');
  devOpen = null;
});

T('1280 宽下无横向滚动', function(){
  TA(window.innerWidth <= 1300, '窗口宽=' + window.innerWidth);
  TA(document.documentElement.scrollWidth <= window.innerWidth + 1,
     '滚动宽=' + document.documentElement.scrollWidth + ' 视口=' + window.innerWidth);
});

T('项目详情提供编辑入口（回归：T17/T18 增删改齐备）', function(){
  route = 'dev'; devOpen = 'd1'; render();
  TA(TQ('[data-act="dev-edit"]'), '详情页缺少编辑按钮');
  TCLICK('[data-act="dev-edit"]');
  TA(TQ('.overlay'), '编辑弹窗未打开');
  TA(TQ('#pName').value === '项目一', '未回填名称');
  TCLICK('[data-act="modal-close"]');
  devOpen = null;
});

T('清空数据需两次确认，取消不执行', function(){
  route = 'settings'; render();
  var before = db.plans.length;
  confirmAnswer = false;
  TCLICK('[data-act="clear"]');
  TA(db.plans.length === before, '取消后仍被清空');
  confirmAnswer = true;
});

/* ---------- 备份导入（FileReader 打桩，使异步路径可同步断言） ---------- */
var SNAPSHOT = JSON.stringify(db);
var EXPECT_PLANS = db.plans.length;

/* 仅替换浏览器内建的 FileReader：真实读取逻辑与断言完全不变，
   目的是去掉"文件读取完成时机"这一非确定性，让导入用例可稳定复现 */
window.FileReader = function(){
  var self = this;
  self.readAsText = function(file){
    self.result = file.__text;
    if(self.onload) self.onload();
  };
};

function doImport(name, content){
  var input = document.getElementById('importFile');
  var file = new File([content], name, { type:'application/json' });
  try { file.__text = content; } catch(e){}
  var dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles:true }));
}

db = blank(); save(); render();

T('导入备份：各模块数据完整恢复', function(){
  doImport('backup.json', SNAPSHOT);
  TA(db.plans.length === EXPECT_PLANS, '计划数=' + db.plans.length);
  TA(db.contents[0].stage === '已发布', '内容阶段丢失');
  TA(db.projects[0].tasks.length === 1, '项目任务丢失');
  TA(db.fitness.week['1'] === '胸', '周安排丢失');
  TA(db.food.items[0].slot === '早餐', '饮食记录丢失');
  TA(db.plays[0].minutes === 45, '游戏时长丢失');
  TA(lastAlert.indexOf('导入完成') > -1, '未提示成功：' + lastAlert);
});

T('导入非法文件：提示失败且不破坏现有数据', function(){
  var before = db.plans.length;
  lastAlert = '';
  doImport('bad.txt', '这不是 json');
  TA(lastAlert.indexOf('导入失败') > -1, '未提示失败，实际=' + (lastAlert || '（无）'));
  TA(db.plans.length === before, '数据被破坏：' + db.plans.length);
});

T('缺少 version 字段的文件同样被拒绝', function(){
  var before = db.plans.length;
  lastAlert = '';
  doImport('no-version.json', JSON.stringify({ plans: [] }));
  TA(lastAlert.indexOf('导入失败') > -1, '未拒绝：' + (lastAlert || '（无）'));
  TA(db.plans.length === before, '数据被破坏');
});

T('导入时选择取消：覆盖被中止', function(){
  var before = db.plans.length;
  confirmAnswer = false;
  lastAlert = '';
  doImport('backup.json', JSON.stringify(blank()));
  TA(db.plans.length === before, '取消后仍被覆盖：' + db.plans.length);
  TA(lastAlert.indexOf('导入完成') === -1, '取消后仍提示成功');
  confirmAnswer = true;
});

T('两次确认后清空全部数据', function(){
  route = 'settings'; render();
  TCLICK('[data-act="clear"]');
  TA(db.plans.length === 0, '计划未清空');
  TA(db.projects.length === 0, '项目未清空');
  TA(db.food.items.length === 0, '饮食未清空');
  TA(db.fitness.logs.length === 0, '打卡未清空');
  TA(TTEXT().indexOf('导入备份文件') > -1 || document.body.innerHTML.indexOf('数据概况') > -1, '清空后页面未正常渲染');
});

TDONE();
