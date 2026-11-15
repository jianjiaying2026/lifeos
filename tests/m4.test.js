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

T('今日训练显示当天安排，打卡后状态与文案切换', function(){
  var wd = String(weekdayNum(todayStr()));
  db.fitness.week[wd] = '胸 + 三头'; save(); render();
  TA(TTEXT().indexOf('胸 + 三头') > -1, '今日安排未显示');
  TA(TTEXT().indexOf('未打卡') > -1, '初始状态不对');
  TCLICK('[data-act="fit-check"]');
  TA(db.fitness.logs.length === 1, '打卡未记录');
  TA(db.fitness.logs[0].note === '胸 + 三头', '打卡备注未取当天安排');
  TA(TTEXT().indexOf('已打卡') > -1, '状态未切换');
  TA(TTEXT().indexOf('撤销今天的打卡') > -1, '未出现撤销入口');
});

T('连续打卡天数：今天+昨天=2；撤销今天后按昨天算=1', function(){
  db.fitness.logs = [
    { id:'a', date: todayStr(), note:'' },
    { id:'b', date: shift(todayStr(), -1), note:'' }
  ];
  save(); render();
  TA(TTEXT().indexOf('连续打卡 2 天') > -1, '连续天数应为 2：' + TTEXT().match(/连续打卡 \d+ 天/));
  TCLICK('[data-act="fit-uncheck"]');
  TA(db.fitness.logs.length === 1, '撤销失败');
  TA(TTEXT().indexOf('连续打卡 1 天') > -1, '撤销后连续天数应为 1');
});

T('中断一天后连续天数重新计数', function(){
  db.fitness.logs = [
    { id:'a', date: shift(todayStr(), -2), note:'' },
    { id:'b', date: shift(todayStr(), -3), note:'' }
  ];
  save(); render();
  TA(TTEXT().indexOf('连续打卡 0 天') > -1, '断档后应从 0 开始：' + TTEXT().match(/连续打卡 \d+ 天/));
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
