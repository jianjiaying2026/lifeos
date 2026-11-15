/* M2：自媒体（灵感池 / 内容创作 / 数据追踪） */
TRESET();

T('灵感添加：文本与标签按逗号拆成 chip', function(){
  route = 'selfmedia'; smTab = 'idea'; render();
  TFILL('#ideaText', 'AI 剪辑工具横评');
  TFILL('#ideaTags', 'AI，工具,效率');
  TCLICK('[data-act="idea-add"]');
  TA(db.ideas.length === 1, '条数=' + db.ideas.length);
  TA(db.ideas[0].tags === 'AI，工具,效率', '标签原文未保存');
  var chips = TALL('.tagline .chip.acc').length;
  TA(chips === 3, '标签 chip 数=' + chips);
});

T('转选题：生成内容、标记已用、自动跳到内容页签', function(){
  TCLICK('[data-act="idea-use"]');
  TA(db.contents.length === 1, '内容数=' + db.contents.length);
  TA(db.contents[0].stage === '选题', '默认阶段=' + db.contents[0].stage);
  TA(db.ideas[0].used === true, '未标记已用');
  TA(smTab === 'content', '当前页签=' + smTab);
  TA(TQ('.tab.on').textContent.indexOf('内容') > -1, '页签高亮不对');
});

T('已用/未用过滤切换生效', function(){
  smTab = 'idea'; render();
  TA(TTEXT().indexOf('AI 剪辑工具横评') === -1, '默认视图仍显示已用灵感');
  TCLICK('[data-act="idea-toggle-used"]');
  TA(TTEXT().indexOf('AI 剪辑工具横评') > -1, '切换后仍看不到已用灵感');
  TA(TTEXT().indexOf('已转选题') > -1, '缺少已用标记');
  TCLICK('[data-act="idea-toggle-used"]');
});

T('新建内容弹窗：必填校验 + 保存', function(){
  smTab = 'content'; render();
  TCLICK('[data-act="content-new"]');
  TCLICK('#modalSave');
  TA(TQ('.overlay'), '空标题竟然保存成功');
  TA(lastAlert.indexOf('标题') > -1, '未提示必填');
  TFILL('#cTitle', '周报模板分享');
  TSET('#cPlat', '公众号');
  TSET('#cStage', '草稿');
  TFILL('#cDate', shift(todayStr(), 2));
  TCLICK('#modalSave');
  TA(db.contents.length === 2, '条数=' + db.contents.length);
  var c = db.contents[0];
  TA(c.title === '周报模板分享' && c.platform === '公众号' && c.stage === '草稿', '字段未保存');
  TA(c.planDate === shift(todayStr(), 2), '计划日期未保存');
});

T('正文保存后列表出现「有正文」，重开仍在', function(){
  TCLICK('[data-act="content-edit"]');
  TFILL('#cBody', '第一段\n第二段');
  TCLICK('#modalSave');
  TA(db.contents[0].body.indexOf('第二段') > -1, '正文未保存');
  TA(TTEXT().indexOf('有正文') > -1, '列表无标记');
  db = load(); render();
  TCLICK('[data-act="content-edit"]');
  TA(TQ('#cBody').value.indexOf('第二段') > -1, '重开后正文丢失');
  TCLICK('[data-act="modal-close"]');
});

T('阶段筛选计数随改动实时变化', function(){
  TQ('[data-act="content-stage"]').value = '已发布';
  TQ('[data-act="content-stage"]').dispatchEvent(new Event('change', {bubbles:true}));
  TA(db.contents[0].stage === '已发布', '阶段未改');
  TA(TTEXT().indexOf('已发布 1') > -1, '已发布计数不对');
  TA(TTEXT().indexOf('草稿 0') > -1, '草稿计数不对（该条已改已发布）');
  TA(TTEXT().indexOf('选题 1') > -1, '选题计数不对');
  TCLICK('[data-act="cm-stage"][data-s="已发布"]');
  TA(TTEXT().indexOf('周报模板分享') > -1, '筛选后看不到该条');
  TA(TTEXT().indexOf('AI 剪辑工具横评') === -1, '筛选未生效');
  TCLICK('[data-act="cm-stage"][data-s="全部"]');
});

T('数据追踪：记录、三处汇总、删除回退', function(){
  smTab = 'data'; render();
  TCLICK('[data-act="metric-new"]');
  TFILL('#mViews', '1200'); TFILL('#mLikes', '60'); TFILL('#mNote', '首条数据');
  TCLICK('#modalSave');
  TA(db.metrics.length === 1, '记录数=' + db.metrics.length);
  var html = TTEXT();
  TA(html.indexOf('>1200<') > -1, '累计播放未显示');
  TA(html.indexOf('>60<') > -1, '累计点赞未显示');
  TA(html.indexOf('平均 60 / 条') > -1, '平均值不对');
  TCLICK('[data-act="metric-del"]');
  TA(db.metrics.length === 0, '删除失败');
  TA(TTEXT().indexOf('还没有数据记录') > -1, '删除后未回到空态');
});

T('删除内容时级联清理其数据记录', function(){
  smTab = 'content'; render();
  var target = db.contents[0];
  db.metrics.push({ id:'mm', contentId: target.id, date: todayStr(), views: 10, likes: 1, note:'' });
  save(); render();
  var before = db.contents.length;
  confirmAnswer = true;
  TQ('[data-act="content-del"]').click();
  TA(db.contents.length === before - 1, '内容未删除');
  TA(db.metrics.filter(function(m){ return m.contentId === target.id; }).length === 0, '关联数据未清理');
});

T('没有内容时记录数据被拦下并提示', function(){
  db.contents = []; save();
  smTab = 'data'; render();
  lastAlert = '';
  TCLICK('[data-act="metric-new"]');
  TA(!document.querySelector('.overlay'), '仍然打开了弹窗');
  TA(lastAlert.indexOf('内容') > -1, '未提示先建内容：' + lastAlert);
});

TDONE();
