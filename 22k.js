/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 加入顯示22K網站的資訊, 如果有的話
 */

/**
 * whenGet: 一個函式, 當22K資料蒐集好之後便將其當作參數來呼叫whenGet
 */
function map22kData(whenGet) {
  if(!whenGet) {
    return ;
  }

  chrome.storage.local.get("22kData", function(ret){
    if(chrome.runtime.lastError) {
      throw Error(chrome.runtime.lastError.message);
    }
    
    // 檢查本地端是否有資料, 有的話檢查下載資料的時間是否在一週以內
    // 如果上述檢查沒通過就重新下載資料, 通過的話就進行 whenGet
    if(!ret.fetchTime || ret.fetchTime + 604800*1000 < new Date()) { 
      updateData(whenGet);
    }
    else {
      whenGet(ret.data);
    }
  });
  
  // 從22k網站下載資料並且儲存起來, 如果成功就進行 whenGet
  function updateData(whenGet) {
    $.get("http://www.22kopendata.org/api/list_data/20/", function(ret) {
      var data = [];

      $("job", ret).each(function(index, elt) {
        var tmp = {};
        tmp.companyName = $("company_name", elt).text();
        tmp.jobName = $("job_name", elt).text();
        tmp.salary = $("salary", elt).text();
        tmp.notes = [];
        var i = 1;
        while(true) { // note 可能有多個
          var note = $("note" + i, elt);
          i++;
          if(note.length != 1) {
            break ;
          }
          tmp.notes.push($(note).text());
        }
        tmp.screenShot = $("job_url_screenshot", elt).text();
        
        data.push(tmp);
      });
      
      chrome.storage.local.set({"22kData": {fetchTime: new Date(), data: data}}, function(){
        whenGet(data);
      });
    });
  }
}