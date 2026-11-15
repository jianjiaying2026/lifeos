/* 测试基础库：注入到被测页面，提供断言、操作、等待与结果输出 */
(function(){
  window.__T = { results: [] };
  window.confirmAnswer = true;
  window.lastAlert = '';

  window.T = function(name, fn){
    try { fn(); __T.results.push({ n: name, ok: true }); }
    catch(e){ __T.results.push({ n: name, ok: false, msg: String((e && e.message) || e) }); }
  };
  window.TA = function(cond, msg){ if(!cond) throw new Error(msg || '断言失败'); };
  window.TQ = function(sel){
    var el = document.querySelector(sel);
    if(!el) throw new Error('找不到元素 ' + sel);
    return el;
  };
  window.TALL = function(sel){ return document.querySelectorAll(sel); };
  window.TCLICK = function(sel){ TQ(sel).click(); };
  window.TFILL = function(sel, v){ TQ(sel).value = v; };
  window.TSET = function(sel, v){ var el = TQ(sel); el.value = v; el.dispatchEvent(new Event('change', {bubbles:true})); };
  window.TENTER = function(sel){ TQ(sel).dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); };
  window.TTEXT = function(){ return document.getElementById('main').innerHTML; };

  /* 每个用例开始前把状态清干净，避免相互污染 */
  window.TRESET = function(){
    confirmAnswer = true;
    lastAlert = '';
    db = blank();
    save();
    route = 'home';
    devOpen = null;
    planDate = todayStr();
    foodDate = todayStr();
    smTab = 'idea';
    cmStage = '全部';
    cfFilter = '全部';
    showUsedIdeas = false;
    render();
  };

  window.TWAIT = function(pred, cb, ms){
    var t0 = Date.now();
    (function loop(){
      var ok = false;
      try { ok = !!pred(); } catch(e){ ok = false; }
      if(ok || Date.now() - t0 > (ms || 5000)){ cb(ok); return; }
      setTimeout(loop, 80);
    })();
  };

  window.TDONE = function(){
    if(document.getElementById('TESTRESULT')) return;
    var s = document.createElement('script');
    s.type = 'application/json';
    s.id = 'TESTRESULT';
    s.textContent = JSON.stringify(__T.results);
    document.body.appendChild(s);
  };

  window.confirm = function(){ return confirmAnswer !== false; };
  window.alert = function(m){ lastAlert = String(m); };
})();
