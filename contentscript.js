var get_company_info = function(){
    var params = {};
    params.link = document.location.href;

    if ('www.104.com.tw' == document.location.hostname) {
	// 有 jQuery 可以用
	var company_dom = jQuery('#comp_header li.comp_name p a', document);
	if (company_dom.length != 0) {
	    params.from = '104';
	    params.name = company_dom.eq(0).text();
	    params.company_link = company_dom.eq(0).attr('href');
	    return params;
	}

	company_dom = jQuery('#comp_header li.comp_name h1', document);
	if (company_dom.length != 0) {
	    params.from = '104';
	    params.name = company_dom.text();
	    params.company_link = document.location;
	    return params;
	}
	
	return;
    } else if ('www.104temp.com.tw' == document.location.hostname) {
	// 檢查所有 a dom, 如果 company_intro.jsp 開頭的不超過兩個不一樣的，就確定是這家公司了
	var a_doms = $('a', document);
	var a_dom;
	for (var i = 0; i < a_doms.length; i ++) {
	    a_dom = a_doms.eq(i);
	    if (!a_dom.attr('href') || !a_dom.attr('href').match(/^company_intro\.jsp/)) {
		continue;
	    }
	    if (params.company_link && params.company_link != a_dom.attr('href')) {
		// 有兩家不一樣的公司，跳過
		return;
	    }
	    params.company_link = a_dom.attr('href');
	    params.name = a_dom.text();
	    params.from = '104temp';
	}

	return params;
    } else if ('www.yes123.com.tw' == document.location.hostname) {
	if (!jQuery('.comp_name').length) {
	    return;
	}
	var matches = document.location.search.match(/p_id=([^&]*)/);
	if (!matches) {
	    return;
	}

	params.from = 'yes123';
	params.name = jQuery('.comp_name').text();
	params.company_link = matches[1];
    } else if ('www.1111.com.tw' == document.location.hostname) {
	var found = false;
	jQuery('#breadcrumb li a').each(function(){
	    var self = $(this);

	    if (self.attr('href').match(/找工作機會/)) {
		params.from = '1111';
		params.name = self.text();
		params.company_link = self.attr('href');
		found = true;
		return false;
	    }
	});
	if (!found) {
	    return;
	}
    } else if ('www.518.com.tw' == document.location.hostname) {
        if (jQuery('#company-title').length) {
            params.from = '518';
            params.name = jQuery('#company-title').text().replace('所有工作機會»', '').replace(' ', '');
            params.company_link = document.location.href;
            return params;
        }

	if (!jQuery('.company-info h2 a').length) {
	    return;
	}

	var dom = jQuery('.company-info h2 a');
	params.from = '518';
	params.name = dom.text();
	params.company_link = dom.attr('href');
    } else {
	return;
    }

    return params;
};

var main = function(){
    // TODO: 只有特定網站才要 sendRequest 來顯示 page action
    chrome.extension.sendRequest({method: 'page'}, function(response){});

    var params = get_company_info();

    if ('object' == typeof(params) && 'undefined' !== typeof(params.name)) {
	get_package_info(function(package_info){
	    get_choosed_packages(function(choosed_packages){
		for (var id in choosed_packages) {
                    (function(id){
                        get_package_csv_by_id(id, function(package_csv){
                            if ('undefined' == typeof(package_csv)) {
                                return;
                            }
                            var rows;
                            for (var i = 0; i < package_csv.length; i ++) {
                                rows = package_csv[i];
                                if (check_name(params.name, rows[0])) {
                                    chrome.extension.sendRequest({method: 'add_match', rows: rows, package_info: get_package_info_by_id(package_info, id)}, function(response) {});
                                }
                            }
                        });
                    }(id))
		}
	    });
	});

        // 處理22K網站的資料
        // 給一個函式當做參數, 函式的參數(data)是所有22K的資料(格式請參考22k.js)
        // 當資料(data)取得成功時一一比對是否與這個頁面的公司名稱相同, 相同的話將所有相關的資料顯示出來
        map22kData(function(data) {
            data.forEach(function(item) {
                if(params.name == item.companyName) {
                    var package_info = {url: item.screenShot, name: "證據"};
                    var rows = [];
                    rows[1] = "'曾出現在揭露22K網站' 職稱:" + item.jobName + " 薪資:" + item.salary;
                    rows[2] = "註記:";
                    item.notes.forEach(function(elt) {
                      rows[2] += (elt + " ");
                    });
                    
                    chrome.extension.sendRequest({method: 'add_match', rows: rows, package_info: package_info}, function(response) {});
                }
            })
        });
    }
};

main();
