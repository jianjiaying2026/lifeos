/* M4：健身计划 + 饮食计划 + 游戏娱乐 */
TRESET();

T('周安排改动即时保存，重载后保留', function(){
  route = 'fitness'; render();
  TSET('[data-act="fit-week"][data-day="3"]', '腿 + 核心');
  TA(db.fitness.week['3'] === '腿 + 核心', '内存未更新');
  var stored = JSON.parse(localStorage.getItem(KEY));
  TA(stored.fitness.week['3'] === '腿 + 核心', '未落盘');
  db = load(); render();
  TA(TQ('[data-act="fit-week"][data-day="3"]').value === '腿 + 核心', '重载后丢失');
});

T('记录训练：部位/动作/组数/次数落库，当天计划同时显示', function(){
  var wd = String(weekdayNum(todayStr()));
  db.fitness.week[wd] = '胸 + 三头'; save();
  fitDate = todayStr(); fitMonth = todayStr().slice(0,7); render();
  TA(TTEXT().indexOf('当天计划：胸 + 三头') > -1, '当天计划未显示');
  TA(TTEXT().indexOf('未记录') > -1, '初始状态不对');
  TSET('#fitPart', '胸');
  TFILL('#fitEx', '卧推');
  TFILL('#fitSets', '4');
  TFILL('#fitReps', '12');
  TCLICK('[data-act="fit-add"]');
  var l = db.fitness.logs[0];
  TA(l && l.date === todayStr(), '记录未落位到选中的日期');
  TA(l.part === '胸' && l.ex === '卧推', '部位/动作不对：' + l.part + '/' + l.ex);
  TA(l.sets === 4 && l.reps === 12, '组次不对：' + l.sets + 'x' + l.reps);
  TA(TTEXT().indexOf('4 组 × 12 次') > -1, '明细未显示组次');
  TA(TTEXT().indexOf('1 个动作') > -1, '当天动作数未显示');
  TA(TTEXT().indexOf('连续打卡 1 天') > -1, '连续天数应为 1');
});

T('空动作被拦下，不写入空记录', function(){
  TFILL('#fitEx', '');
  TCLICK('[data-act="fit-add"]');
  TA(db.fitness.logs.length === 1, '空动作竟然写入：' + db.fitness.logs.length);
  var t = document.getElementById('toast');
  TA(t && t.textContent.indexOf('动作') > -1, '未提示：' + (t ? t.textContent : '无提示'));
});

T('连续打卡：今天+昨天=2；删掉今天后=1', function(){
  db.fitness.logs = [
    { id:'a', date: todayStr(), part:'胸', ex:'卧推', sets:3, reps:10 },
    { id:'b', date: shift(todayStr(), -1), part:'背', ex:'划船', sets:3, reps:10 }
  ];
  save(); fitDate = todayStr(); fitMonth = todayStr().slice(0,7); render();
  TA(TTEXT().indexOf('连续打卡 2 天') > -1, '应为 2：' + (TTEXT().match(/连续打卡 \d+ 天/) || ['(未找到)'])[0]);
  TQ('[data-act="fit-del"]').click();
  TA(db.fitness.logs.length === 1, '删除失败');
  TA(TTEXT().indexOf('连续打卡 1 天') > -1, '删掉今天后应为 1');
});

T('中断一天后连续天数重新计数', function(){
  db.fitness.logs = [
    { id:'a', date: shift(todayStr(), -2), part:'腿', ex:'深蹲', sets:5, reps:5 },
    { id:'b', date: shift(todayStr(), -3), part:'肩', ex:'推举', sets:4, reps:8 }
  ];
  save(); fitDate = todayStr(); render();
  TA(TTEXT().indexOf('连续打卡 0 天') > -1, '断档后应从 0 开始：' + (TTEXT().match(/连续打卡 \d+ 天/) || ['(未找到)'])[0]);
});

T('日历：切月、点某天、在该天记录、回到今天', function(){
  db.fitness.logs = []; save();
  fitDate = todayStr(); fitMonth = todayStr().slice(0,7); render();
  var prev = shiftMonth(fitMonth, -1);
  TCLICK('[data-act="fit-month"][data-n="-1"]');
  TA(fitMonth === prev, '月份未切换：' + fitMonth);
  var target = prev + '-05';
  TQ('[data-act="cal-pick"][data-date="' + target + '"]').click();
  TA(fitDate === target, '点击日历未切换日期：' + fitDate);
  TFILL('#fitEx', '深蹲'); TFILL('#fitSets', '5'); TFILL('#fitReps', '5');
  TCLICK('[data-act="fit-add"]');
  TA(db.fitness.logs[0].date === target, '记录日期错误：' + db.fitness.logs[0].date);
  TA(TTEXT().indexOf('5 组 × 5 次') > -1, '明细未显示组次');
  TA(TTEXT().indexOf('1 个动作') > -1, '日历当天未显示动作数');
  TCLICK('[data-act="fit-today"]');
  TA(fitDate === todayStr(), '回到今天失败');
  TA(fitMonth === todayStr().slice(0,7), '月份未回到本月');
});

T('饮食：按钮与回车都能落到对应餐次', function(){
  route = 'food'; foodDate = todayStr(); render();
  TFILL('#food-早餐', '鸡蛋');
  TCLICK('[data-act="food-add"][data-slot="早餐"]');
  TFILL('#food-午餐', '牛肉面');
  TENTER('#food-午餐');
  TFILL('#food-晚餐', '沙拉');
  TCLICK('[data-act="food-add"][data-slot="晚餐"]');
  TA(db.food.items.length === 3, '条数=' + db.food.items.length);
  TA(db.food.items[0].slot === '早餐', '第 1 条餐次=' + db.food.items[0].slot);
  TA(db.food.items[1].slot === '午餐', '第 2 条餐次=' + db.food.items[1].slot);
  TA(db.food.items[2].slot === '晚餐', '第 3 条餐次=' + db.food.items[2].slot);
});

T('常吃项按出现频次取前 14，最高频排第一', function(){
  db.food.items = [];
  for(var i = 0; i < 20; i++){
    db.food.items.push({ id:'q' + i, date: todayStr(), slot:'早餐', text:'食物' + i });
  }
  for(var j = 0; j < 5; j++){
    db.food.items.push({ id:'r' + j, date: todayStr(), slot:'午餐', text:'食物15' });
  }
  save();
  foodDate = todayStr(); render();
  var pills = TALL('[data-act="food-quick"]');
  TA(pills.length === 14, '常吃项数量=' + pills.length);
  TA(pills[0].dataset.text === '食物15', '首位=' + pills[0].dataset.text);
});

T('常吃项加入时遵循所选餐次', function(){
  TSET('#commonSlot', '加餐');
  TCLICK('[data-act="food-quick"]');
  var last = db.food.items[db.food.items.length - 1];
  TA(last.slot === '加餐', '实际餐次=' + last.slot);
});

T('饮食日期切换：改昨天不影响今天的记录', function(){
  var todayCount = db.food.items.filter(function(x){ return x.date === todayStr(); }).length;
  TCLICK('[data-act="food-shift"][data-n="-1"]');
  TA(foodDate === shift(todayStr(), -1), '日期未切换');
  TFILL('#food-早餐', '昨天的早餐');
  TCLICK('[data-act="food-add"][data-slot="早餐"]');
  TA(db.food.items.filter(function(x){ return x.date === todayStr(); }).length === todayCount, '今天条数被改动');
  TA(db.food.items.filter(function(x){ return x.date === shift(todayStr(), -1); }).length === 1, '昨天记录未落位');
  TCLICK('[data-act="food-today"]');
});

T('游戏：+30 分 / +1 时 累加到本周合计', function(){
  route = 'game'; render();
  TCLICK('[data-act="game-new"]');
  TFILL('#gName', '哈迪斯');
  TCLICK('#modalSave');
  TA(db.games.length === 1, '游戏未添加');
  TCLICK('[data-act="game-log"][data-min="30"]');
  TCLICK('[data-act="game-log"][data-min="60"]');
  var total = db.plays.reduce(function(n,p){ return n + p.minutes; }, 0);
  TA(total === 90, '合计=' + total);
  TA(TTEXT().indexOf('90 分钟') > -1, '游戏行未显示本周时长');
});

T('自定义时长：非法分钟数被拦下', function(){
  TCLICK('[data-act="game-log-custom"]');
  TFILL('#pMin', '0');
  TCLICK('#modalSave');
  TA(TQ('.overlay'), '0 分钟竟然保存成功');
  TA(lastAlert.indexOf('分钟') > -1, '未提示：' + lastAlert);
  TFILL('#pMin', '45');
  TFILL('#pDate', shift(todayStr(), -2));
  TCLICK('#modalSave');
  TA(db.plays.length === 3, '记录数=' + db.plays.length);
  TA(db.plays[2].minutes === 45, '分钟数=' + db.plays[2].minutes);
});

T('本周合计不计入上周数据', function(){
  var mon = weekRange()[0];
  db.plays = [
    { id:'a', gameId: db.games[0].id, date: todayStr(), minutes: 60 },
    { id:'b', gameId: db.games[0].id, date: shift(mon, -1), minutes: 120 }
  ];
  save(); render();
  TA(TTEXT().indexOf('本周 60 分钟') > -1, '游戏行本周时长不对：' + TTEXT().match(/本周 \d+ 分钟/));
  route = 'home'; render();
  TA(TQ('.kpi[data-route="game"] .k-num').textContent === '1h', '首页本周时长=' + TQ('.kpi[data-route="game"] .k-num').textContent);
  route = 'game'; render();
});

T('游戏状态可修改，删除游戏连带清理时长记录', function(){
  route = 'game'; render();
  var sel = TQ('[data-act="game-status"]');
  sel.value = '通关';
  sel.dispatchEvent(new Event('change', {bubbles:true}));
  TA(db.games[0].status === '通关', '状态未改');
  confirmAnswer = true;
  TQ('[data-act="game-del"]').click();
  TA(db.games.length === 0, '游戏未删除');
  TA(db.plays.length === 0, '时长记录未清理，剩 ' + db.plays.length);
});

TDONE();
