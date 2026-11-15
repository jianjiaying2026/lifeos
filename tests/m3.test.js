/* M3：开发工作 + 咨询工作 */
TRESET();

T('新建项目：必填校验 + 默认状态为「想法」', function(){
  route = 'dev'; render();
  TCLICK('[data-act="dev-new"]');
  TCLICK('#modalSave');
  TA(TQ('.overlay'), '空名称竟然保存成功');
  TA(lastAlert.indexOf('项目名') > -1, '未提示必填：' + lastAlert);
  TFILL('#pName', '个人博客改版');
  TFILL('#pDesc', '重做首页');
  TCLICK('#modalSave');
  TA(db.projects.length === 1, '项目数=' + db.projects.length);
  TA(db.projects[0].status === '想法', '默认状态=' + db.projects[0].status);
  TA(Array.isArray(db.projects[0].tasks) && Array.isArray(db.projects[0].issues), '子集合未初始化');
});

T('新建项目后直接进入详情，工作项入口可见', function(){
  TA(devOpen === db.projects[0].id, '未自动进入项目详情');
  TA(TTEXT().indexOf('工作项') > -1, '详情页没有工作项区块');
  TA(TQ('#devTaskInput'), '没有工作项输入框');
  TA(TQ('[data-act="dev-item-new"]'), '没有「新增工作项」按钮');
});

T('工作项勾选后进度条按比例变化（1/2=50%）', function(){
  TFILL('#devTaskInput', '搭框架'); TCLICK('[data-act="dev-task-add"]');
  TFILL('#devTaskInput', '写样式'); TCLICK('[data-act="dev-task-add"]');
  TA(db.projects[0].tasks.length === 2, '任务数=' + db.projects[0].tasks.length);
  TALL('[data-act="dev-task-toggle"]')[0].click();
  TA(TQ('.prog i').style.width === '50%', '勾 1 条时进度条=' + TQ('.prog i').style.width);
  TALL('[data-act="dev-task-toggle"]')[1].click();
  TA(TQ('.prog i').style.width === '100%', '全完成时进度条=' + TQ('.prog i').style.width);
  TALL('[data-act="dev-task-toggle"]')[1].click();
  TA(TQ('.prog i').style.width === '50%', '取消 1 条后进度条=' + TQ('.prog i').style.width);
});

T('编辑项目：改名称/说明/状态后详情与列表同步', function(){
  TQ('[data-act="dev-edit"]').click();
  TA(TQ('#pName').value === '个人博客改版', '弹窗未回填名称');
  TA(TQ('#pDesc').value === '重做首页', '弹窗未回填说明');
  TFILL('#pName', '个人博客 v2');
  TFILL('#pDesc', '换掉整站样式');
  TSET('#pStatus', '进行中');
  TCLICK('#modalSave');
  var p = db.projects[0];
  TA(p.name === '个人博客 v2', '名称未保存：' + p.name);
  TA(p.desc === '换掉整站样式', '说明未保存：' + p.desc);
  TA(p.status === '进行中', '状态未保存：' + p.status);
  TA(TTEXT().indexOf('个人博客 v2') > -1, '详情页未刷新');
  TCLICK('[data-act="dev-close"]');
  TA(TTEXT().indexOf('个人博客 v2') > -1, '列表未刷新');
  TA(TTEXT().indexOf('换掉整站样式') > -1, '列表未显示新说明');
});

T('任务删除后进度条重算', function(){
  TCLICK('[data-act="dev-open"]');
  var before = db.projects[0].tasks.length;
  /* 删掉那条未完成的，剩下的已完成 → 进度应为 100% */
  var undone = TALL('[data-act="dev-task-del"]')[1];
  undone.click();
  TA(db.projects[0].tasks.length === before - 1, '任务未删除');
  TA(TQ('.prog i').style.width === '100%', '删除后进度=' + TQ('.prog i').style.width);
});

T('从项目列表直接新增工作项，不必先进项目', function(){
  TCLICK('[data-act="dev-close"]');
  TA(devOpen === null, '未回到列表');
  TCLICK('[data-act="dev-item-new"]');
  TFILL('#wiText', '写部署脚本');
  TCLICK('#modalSave');
  TA(db.projects[0].tasks.some(function(t){ return t.text === '写部署脚本'; }), '列表页新增工作项失败');
  /* 详情页的「＋ 新增工作项」按钮同样可用 */
  TCLICK('[data-act="dev-open"]');
  TA(TQ('[data-act="dev-item-new"]'), '详情页没有新增工作项按钮');
  TCLICK('[data-act="dev-item-new"]');
  TFILL('#wiText', '补 README');
  TCLICK('#modalSave');
  TA(db.projects[0].tasks.some(function(t){ return t.text === '补 README'; }), '详情页新增工作项失败');
});

T('问题记录：新增、标记解决、未解决数联动', function(){
  TFILL('#devIssueInput', '移动端错位'); TCLICK('[data-act="dev-issue-add"]');
  TFILL('#devIssueInput', '图片不显示'); TCLICK('[data-act="dev-issue-add"]');
  TA(db.projects[0].issues.length === 2, '问题数=' + db.projects[0].issues.length);
  TA(TTEXT().indexOf('2 个未解决') > -1, '未解决数不对');
  TCLICK('[data-act="dev-issue-toggle"]');
  TA(db.projects[0].issues[0].resolved === true, '未标记解决');
  TA(TTEXT().indexOf('1 个未解决') > -1, '解决后计数不对');
  TQ('[data-act="dev-issue-del"]').click();
  TA(db.projects[0].issues.length === 1, '问题删除失败');
});

T('删除项目需确认，确认后连带子项一并移除', function(){
  TCLICK('[data-act="dev-close"]');
  confirmAnswer = false;
  TQ('[data-act="dev-del"]').click();
  TA(db.projects.length === 1, '取消后项目被删除');
  confirmAnswer = true;
  TQ('[data-act="dev-del"]').click();
  TA(db.projects.length === 0, '确认后未删除');
  TA(TTEXT().indexOf('还没有项目') > -1, '删除后未回到空态');
});

T('咨询记录：必填校验 + 保存字段完整', function(){
  route = 'consult'; render();
  TCLICK('[data-act="consult-new"]');
  TCLICK('#modalSave');
  TA(TQ('.overlay'), '空对象竟然保存成功');
  TA(lastAlert.indexOf('咨询对象') > -1, '未提示必填');
  TFILL('#sWho', '张先生'); TFILL('#sTopic', '职业规划');
  TFILL('#sDate', todayStr()); TFILL('#sFollow', todayStr());
  TFILL('#sSum', '建议先做作品集');
  TCLICK('#modalSave');
  var c = db.consults[0];
  TA(c.who === '张先生' && c.topic === '职业规划', '字段未保存');
  TA(c.status === '待跟进', '默认状态=' + c.status);
  TA(c.followUp === todayStr(), '跟进日未保存');
});

T('到期判定：今天到期高亮，明天到期不高亮', function(){
  db.consults[0].followUp = shift(todayStr(), 1); save(); render();
  TA(TTEXT().indexOf('该跟进了') === -1, '明天到期却高亮了');
  db.consults[0].followUp = todayStr(); save(); render();
  TA(TTEXT().indexOf('该跟进了') > -1, '今天到期未高亮');
  db.consults[0].followUp = shift(todayStr(), -3); save(); render();
  TA(TTEXT().indexOf('该跟进了') > -1, '过期未高亮');
});

T('咨询状态筛选与首页待跟进数联动', function(){
  TCLICK('[data-act="consult-filter"][data-f="待跟进"]');
  TA(TTEXT().indexOf('张先生') > -1, '待跟进筛选看不到记录');
  TQ('[data-act="consult-status"]').value = '已完成';
  TQ('[data-act="consult-status"]').dispatchEvent(new Event('change', {bubbles:true}));
  TA(db.consults[0].status === '已完成', '状态未改');
  TA(TTEXT().indexOf('该跟进了') === -1, '完成后仍高亮');
  route = 'home'; render();
  TA(TQ('.kpi[data-route="consult"] .k-num').textContent === '0', '首页待跟进未归零');
});

T('咨询编辑：结论与跟进日可修改', function(){
  route = 'consult'; cfFilter = '全部'; render();
  TCLICK('[data-act="consult-edit"]');
  TFILL('#sSum', '已给作品集清单');
  TFILL('#sFollow', shift(todayStr(), 5));
  TCLICK('#modalSave');
  TA(db.consults[0].summary === '已给作品集清单', '结论未保存');
  TA(db.consults[0].followUp === shift(todayStr(), 5), '跟进日未保存');
});

T('咨询删除：取消则保留，确认后移除', function(){
  route = 'consult'; cfFilter = '全部'; render();
  confirmAnswer = false;
  TQ('[data-act="consult-del"]').click();
  TA(db.consults.length === 1, '取消后仍被删除');
  confirmAnswer = true;
  TQ('[data-act="consult-del"]').click();
  TA(db.consults.length === 0, '确认后未删除：' + db.consults.length);
  TA(TTEXT().indexOf('还没有咨询记录') > -1, '删除后未回到空态');
});

TDONE();
