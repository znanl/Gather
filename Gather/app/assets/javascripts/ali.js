;(function() {

function ali(){}
	// settings
	ali.img_path = 'http://www.a-li.com.cn/data/attachment/portal/emotion/';
	ali.sheet_path = 'sheet_64.png';

	ali.use_css_imgs = false;
	ali.colons_mode = false;
	ali.text_mode = false;
	ali.include_title = false;
	ali.allow_native = true;
	ali.use_sheet = false;
	ali.path_only = true;

	ali.inits = {};
	ali.map = {};

	ali.replace_emoticons = function(str){
		ali.init_emoticons();
		return str.replace(ali.rx_emoticons, function(m, $1, $2){
			var val = ali.map.emoticons[$2];
			return val ? $1+ali.replacement(val, $2) : m;
		});
	};
	ali.replace_emoticons_with_colons = function(str){
		ali.init_emoticons();
		return str.replace(ali.rx_emoticons, function(m, $1, $2){
			var val = ali.data[ali.map.emoticons[$2]][3][0];
			return val ? $1+':'+val+':' : m;
		});
	};
	ali.replace_colons = function(str){
		ali.init_colons();
		return str.replace(ali.rx_colons, function(m){
			var idx = m.substr(1, m.length-2);
			var val = ali.map.colons[idx];
			return val ? ali.replacement(val, idx, ':') : m;
		});
	};
	ali.replace_unified = function(str){
		ali.init_unified();
		return str.replace(ali.rx_unified, function(m){
			var val = ali.map.unified[m];
			return val ? ali.replacement(val) : m;
		});
	};

	ali.replacement = function(idx, actual, wrapper){
		wrapper = wrapper || '';
		if (ali.colons_mode) return ':'+ali.data[idx][3][0]+':';
		var text_name = (actual) ? wrapper+actual+wrapper : ali.data[idx][6] || wrapper+ali.data[idx][3][0]+wrapper;
		if (ali.text_mode) return text_name;
		ali.init_env();
		if (ali.replace_mode == 'unified'  && ali.allow_native && ali.data[idx][0][0]) return ali.data[idx][0][0];
		if (ali.replace_mode == 'softbank' && ali.allow_native && ali.data[idx][1]) return ali.data[idx][1];
		if (ali.replace_mode == 'google'   && ali.allow_native && ali.data[idx][2]) return ali.data[idx][2];
		var img = ali.data[idx][7] || ali.img_path+idx+'.gif';
		var title = ali.include_title ? ' title="'+(actual || ali.data[idx][3][0])+'"' : '';
		var text  = ali.include_text  ? wrapper+(actual || ali.data[idx][3][0])+wrapper : '';
		if (ali.supports_css) {
			var px = ali.data[idx][4];
			var py = ali.data[idx][5];
			if (ali.use_sheet && px != null && py != null){
				var mul = 100 / (ali.sheet_size - 1);
				var style = 'background: url('+ali.sheet_path+');background-position:'+(mul*px)+'% '+(mul*py)+'%;background-size:'+ali.sheet_size+'00%';
				return '<span class="ali-outer ali-sizer"><span class="ali-inner" style="'+style+'"'+title+'>'+text+'</span></span>';
			}else if (ali.use_css_imgs){
				return '<span class="ali ali-'+idx+'"'+title+'>'+text+'</span>';
			}else if (ali.path_only){
				return ' ' + img + ' ';
			}else{
				return '<span class="ali ali-sizer" style="background-image:url('+img+')"'+title+'>'+text+'</span>';
			}
		}
		return '<img src="'+img+'" class="ali" '+title+'/>';
	};

	ali.init_emoticons = function(){
		if (ali.inits.emoticons) return;
		ali.init_colons(); // we require this for the emoticons map
		ali.inits.emoticons = 1;

		var a = [];
		ali.map.emoticons = {};
		for (var i in ali.emoticons_data){
			// because we never see some characters in our text except as entities, we must do some replacing
			var emoticon = i.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');

			if (!ali.map.colons[ali.emoticons_data[i]]) continue;

			ali.map.emoticons[emoticon] = ali.map.colons[ali.emoticons_data[i]];
			a.push(ali.escape_rx(emoticon));
		}
		ali.rx_emoticons = new RegExp(('(^|\\s)('+a.join('|')+')(?=$|[\\s|\\?\\.,!])'), 'g');
	};
	ali.init_colons = function(){
		if (ali.inits.colons) return;
		ali.inits.colons = 1;
		ali.rx_colons = new RegExp('\:[^\\s:]+\:', 'g');
		ali.map.colons = {};
		for (var i in ali.data){
			for (var j=0; j<ali.data[i][3].length; j++){
				ali.map.colons[ali.data[i][3][j]] = i;
			}
		}
	};
	ali.init_unified = function(){
		if (ali.inits.unified) return;
		ali.inits.unified = 1;

		var a = [];
		ali.map.unified = {};

		for (var i in ali.data){
			for (var j=0; j<ali.data[i][0].length; j++){
				a.push(ali.data[i][0][j]);
				ali.map.unified[ali.data[i][0][j]] = i;
			}
		}

		ali.rx_unified = new RegExp('('+a.join('|')+')', "g");
	};
	ali.init_env = function(){
		if (ali.inits.env) return;
		ali.inits.env = 1;
		ali.replace_mode = 'img';
		ali.supports_css = false;
		var ua = navigator.userAgent;
		if (window.getComputedStyle){
			var st = window.getComputedStyle(document.body);
			if (st['background-size'] || st['backgroundSize']){
				ali.supports_css = true;
			}
		}
		if (ua.match(/(iPhone|iPod|iPad|iPhone\s+Simulator)/i)){
			if (ua.match(/OS\s+[12345]/i)){
				ali.replace_mode = 'softbank';
				return;
			}
			if (ua.match(/OS\s+[6789]/i)){
				ali.replace_mode = 'unified';
				return;
			}
		}
		if (ua.match(/Mac OS X 10[._ ][789]/i)){
			if (!ua.match(/Chrome/i)){
				ali.replace_mode = 'unified';
				return;
			}
		}
		// Need a better way to detect android devices that actually
		// support ali.
		if (false && ua.match(/Android/i)){
			ali.replace_mode = 'google';
			return;
		}
		if (ali.supports_css){
			ali.replace_mode = 'css';
		}
		// nothing fancy detected - use images
	};
	ali.escape_rx = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	};
	ali.sheet_size = 30;
	ali.data = {"0001":[[],"","",["欠揍"],25,5],"0002":[[],"","",["叹气"],16,11],"0003":[[],"","",["赖皮","锤地"],0,13],"0004":[[],"","",["拍手"],26,26],"0005":[[],"","",["感动"],21,10],"0006":[[],"","",["晚安"],2,5],"0007":[[],"","",["惊讶"],8,25],"0008":[[],"","",["怒气"],14,24],"0009":[[],"","",["哭泣"],19,3],"0010":[[],"","",["吃惊"],28,18],"0011":[[],"","",["想","疑问"],12,22],"0012":[[],"","",["嘲弄"],21,17],"0013":[[],"","",["美"],14,21],"0014":[[],"","",["呀"],20,5],"0015":[[],"","",["啊","羡慕"],0,6],"0016":[[],"","",["飘过"],1,1],"0017":[[],"","",["大笑"],5,1],"0018":[[],"","",["大汗"],28,6],"0019":[[],"","",["转圈哭"],2,26],"0020":[[],"","",["神经病"],19,15],"0021":[[],"","",["渴望","大眼睛"],14,18],"0022":[[],"","",["笑"],12,27],"0023":[[],"","",["啦啦啦"],11,14],"0024":[[],"","",["额","黑线"],6,8],"0026":[[],"","",["蹑手蹑脚"],18,27],"0027":[[],"","",["抱抱走"],8,25],"0028":[[],"","",["揪耳朵"],8,3],"0029":[[],"","",["蹭"],4,28],"0030":[[],"","",["拍桌子","不耐","不耐烦"],25,25],"0031":[[],"","",["汗"],13,23],"0032":[[],"","",["惊"],15,8],"0033":[[],"","",["不理你"],11,7],"0034":[[],"","",["惊汗"],8,14],"0035":[[],"","",["喜"],25,19],"0036":[[],"","",["隐身"],3,9],"0037":[[],"","",["不要"],3,11],"0038":[[],"","",["遁"],10,16],"0039":[[],"","",["呃"],1,24],"0040":[[],"","",["走了"],22,17],"0041":[[],"","",["贱"],7,0],"0042":[[],"","",["不公平"],10,23],"0043":[[],"","",["火球"],18,14],"0044":[[],"","",["爬来了"],21,22],"0045":[[],"","",["来亲个"],8,26],"0046":[[],"","",["喷"],18,12],"0047":[[],"","",["蛋花哭"],20,22],"0048":[[],"","",["推"],3,25],"0049":[[],"","",["快跑呀"],27,10],"0050":[[],"","",["温暖"],19,25],"0051":[[],"","",["点头"],15,21],"0052":[[],"","",["拥抱"],25,8],"0053":[[],"","",["撒钱"],22,25],"0054":[[],"","",["新年快乐"],15,4],"0055":[[],"","",["拜年"],15,11],"0056":[[],"","",["礼物"],4,6],"0057":[[],"","",["雪人"],24,21],"0058":[[],"","",["一只花"],6,21],"0059":[[],"","",["献花"],25,27],"0060":[[],"","",["约会去"],19,20],"0061":[[],"","",["心"],7,24],"0062":[[],"","",["亲"],16,10],"0063":[[],"","",["囧"],5,20],"0064":[[],"","",["不要"],6,19],"0065":[[],"","",["冷"],12,1],"0066":[[],"","",["抠鼻孔"],18,2],"0067":[[],"","",["不要啊"],14,17],"0068":[[],"","",["笑"],15,23],"0069":[[],"","",["寒"],2,0],"0070":[[],"","",["摇摆"],14,28],"0071":[[],"","",["亲爱的"],4,13],"0072":[[],"","",["真美好"],22,9],"0073":[[],"","",["傻笑"],25,21],"0074":[[],"","",["扭扭"],19,14],"0075":[[],"","",["疯"],25,4],"0076":[[],"","",["噶然"],24,19],"0077":[[],"","",["挑眼"],20,17],"0078":[[],"","",["踢踏"],6,19],"0079":[[],"","",["哭"],21,6],"0080":[[],"","",["抓狂"],1,21],"0081":[[],"","",["强"],7,27],"0082":[[],"","",["衰"],15,26],"0083":[[],"","",["火炬手"],25,27],"0084":[[],"","",["住嘴"],14,3],"0085":[[],"","",["捏脸"],13,1],"0086":[[],"","",["扭"],0,2],"0087":[[],"","",["抓"],17,8],"0088":[[],"","",["蜷"],1,11],"0089":[[],"","",["别"],15,2],"0090":[[],"","",["挠墙"],0,28],"0091":[[],"","",["风筝"],9,23],"0092":[[],"","",["喝"],20,5],"0093":[[],"","",["跑圈"],6,26],"0094":[[],"","",["无所"],16,17],"0095":[[],"","",["汗"],18,10],"0096":[[],"","",["滚2"],5,7],"0097":[[],"","",["不好意思"],14,2],"0098":[[],"","",["俯卧撑"],24,15],"0099":[[],"","",["藏"],26,4],"0100":[[],"","",["狂笑"],0,2],"0101":[[],"","",["抱枕"],8,8],"0102":[[],"","",["看看"],21,10],"0103":[[],"","",["吼叫"],9,26],"0104":[[],"","",["嚷"],3,16],"0105":[[],"","",["捂脸"],21,20],"0106":[[],"","",["唠叨"],13,16],"0107":[[],"","",["安慰"],26,23],"0108":[[],"","",["雷"],22,2],"0109":[[],"","",["闪人"],7,1],"0110":[[],"","",["旋转"],18,1],"0111":[[],"","",["好冷"],3,20],"0112":[[],"","",["摔瓶子"],15,9],"0113":[[],"","",["幸福"],10,16],"0114":[[],"","",["捏脸"],0,24],"0115":[[],"","",["汗"],25,22],"0116":[[],"","",["爱情"],18,22],"0117":[[],"","",["中箭"],26,15],"0118":[[],"","",["啊啊啊"],9,23],"0119":[[],"","",["拜拜"],9,18],"0120":[[],"","",["抓狂"],6,26],"0121":[[],"","",["狂笑"],21,2],"0122":[[],"","",["捏脸","扯脸"],14,18],"0123":[[],"","",["揉眼睛"],6,9],"0124":[[],"","",["郁闷"],16,13],"0125":[[],"","",["抓狂"],25,19],"0126":[[],"","",["快乐"],8,12],"0127":[[],"","",["潜水"],4,23],"0128":[[],"","",["开心"],6,11],"0129":[[],"","",["出走"],15,3],"0130":[[],"","",["吃黄瓜"],9,25],"0131":[[],"","",["冷笑话"],3,6],"0132":[[],"","",["大惊"],18,27],"0133":[[],"","",["顶"],8,26],"0134":[[],"","",["潜"],28,23],"0135":[[],"","",["嘘嘘"],1,11],"0136":[[],"","",["转眼睛"],7,1],"0137":[[],"","",["委屈"],17,0],"0138":[[],"","",["变脸"],14,12],"0139":[[],"","",["画圈圈"],7,1],"0140":[[],"","",["玩电脑"],7,26],"0141":[[],"","",["nobbody"],11,20],"0142":[[],"","",["扭屁股"],18,20],"0143":[[],"","",["吐"],0,18],"0144":[[],"","",["伸脖走"],14,26],"0145":[[],"","",["哭着跑"],15,15],"0146":[[],"","",["阿狸侠"],17,12],"0147":[[],"","",["僵尸跳"],25,12],"0148":[[],"","",["虎年"],12,20],"0149":[[],"","",["冷死了"],20,5],"0150":[[],"","",["石化"],13,2],"0151":[[],"","",["惆怅","好忧伤"],1,9],"0152":[[],"","",["分身"],25,20],"0153":[[],"","",["摸头"],25,12],"0154":[[],"","",["罪"],17,6],"0155":[[],"","",["提裤裤"],16,11],"0156":[[],"","",["吃包子"],8,4],"0157":[[],"","",["舞"],1,24],"0158":[[],"","",["蹭"],15,25],"0159":[[],"","",["吊"],26,15],"0160":[[],"","",["开车"],16,26],"0161":[[],"","",["打滚"],16,5],"0162":[[],"","",["叩拜"],18,13],"0163":[[],"","",["转圈圈"],5,5],"0164":[[],"","",["期盼"],16,19],"0165":[[],"","",["跑"],5,10],"0166":[[],"","",["变脸"],4,16],"0167":[[],"","",["惊"],21,11],"0168":[[],"","",["看书"],21,2],"0169":[[],"","",["摸"],14,22],"0170":[[],"","",["做饭"],18,9],"0171":[[],"","",["扭动"],3,17],"0172":[[],"","",["影随主动"],23,27],"0173":[[],"","",["美"],28,19],"0174":[[],"","",["挂树上"],21,23],"0175":[[],"","",["世界杯"],20,11],"0176":[[],"","",["摇摆"],15,19],"0177":[[],"","",["爱"],19,17],"0178":[[],"","",["数钱"],28,23],"0179":[[],"","",["拖走"],8,5],"0180":[[],"","",["女王笑"],26,2],"0181":[[],"","",["早上好"],9,26],"0182":[[],"","",["玛丽莲梦桃"],20,16],"0183":[[],"","",["不要嘛"],19,28],"0184":[[],"","",["扑倒"],6,26],"0185":[[],"","",["听音乐"],3,18],"0186":[[],"","",["行礼"],13,10],"0187":[[],"","",["吻"],15,23],"0188":[[],"","",["热"],6,20],"0189":[[],"","",["踢屏"],10,3],"0190":[[],"","",["拉走"],3,3],"0191":[[],"","",["啊，对"],6,0],"0192":[[],"","",["蹭蹭"],10,9],"0193":[[],"","",["酷哦"],10,0],"0194":[[],"","",["围观"],3,21],"0195":[[],"","",["织毛衣"],16,23],"0196":[[],"","",["无敌双侠"],7,17],"0197":[[],"","",["训人"],15,3],"0198":[[],"","",["腻味银"],6,15],"0199":[[],"","",["再见"],27,25],"0200":[[],"","",["好痛"],15,15],"0201":[[],"","",["加1"],12,14],"0202":[[],"","",["怕"],20,12],"0204":[[],"","",["踢球"],16,22],"0205":[[],"","",["加油加油"],4,16],"0206":[[],"","",["剪"],22,1],"0207":[[],"","",["姐是个传奇"],22,5],"0208":[[],"","",["扇巴掌"],28,16],"0209":[[],"","",["深渊"],3,25],"0210":[[],"","",["压力"],4,16],"0211":[[],"","",["焦糖舞"],15,21],"0212":[[],"","",["晕啊"],25,6],"0213":[[],"","",["好啊"],15,24],"0214":[[],"","",["喷鼻血"],5,14],"0215":[[],"","",["神算章鱼哥"],17,5],"0216":[[],"","",["不要呀"],15,22],"0217":[[],"","",["翻滚"],25,19],"0218":[[],"","",["好热啊"],8,11],"0219":[[],"","",["西瓜啊"],21,21],"0220":[[],"","",["冰淇淋"],4,26],"0221":[[],"","",["洗澡"],9,5],"0222":[[],"","",["拍屁股做鬼脸"],16,3],"0223":[[],"","",["切"],1,27],"0224":[[],"","",["想要"],8,6],"0225":[[],"","",["泪奔"],26,9],"0226":[[],"","",["只告诉你"],19,15],"0227":[[],"","",["啊~~~~"],17,20],"0228":[[],"","",["不"],21,28],"0229":[[],"","",["讨厌啦"],11,19],"0230":[[],"","",["呃"],11,7],"0231":[[],"","",["河蟹掉啦"],0,19],"0232":[[],"","",["沙发阿狸"],4,8],"0233":[[],"","",["沙发桃子"],13,8],"0234":[[],"","",["嗨~"],21,15],"0235":[[],"","",["七夕"],14,27],"0236":[[],"","",["上线"],9,9],"0237":[[],"","",["呼噜"],5,13],"0238":[[],"","",["哦耶"],12,27],"0239":[[],"","",["开饭啦"],9,20],"0240":[[],"","",["喷嚏"],22,16],"0241":[[],"","",["挂衣架"],5,8],"0242":[[],"","",["why"],3,3],"0243":[[],"","",["大熊拍手"],25,3],"0244":[[],"","",["拉拉队"],21,10],"0245":[[],"","",["去死"],10,13],"0246":[[],"","",["阿狸骑木马"],11,6],"0247":[[],"","",["桃子骑木马"],0,13],"0248":[[],"","",["害羞"],15,28],"0249":[[],"","",["一边去"],21,6],"0250":[[],"","",["疾跑"],16,18],"0251":[[],"","",["怕"],16,5],"0252":[[],"","",["吐血"],9,0],"0253":[[],"","",["荡秋千"],2,17],"0254":[[],"","",["桃子撒钱"],8,10],"0255":[[],"","",["砍人"],16,23],"0256":[[],"","",["谢谢"],19,24],"0257":[[],"","",["表逼我"],28,28],"0258":[[],"","",["跷跷板"],15,16],"0259":[[],"","",["掰花瓣"],0,15],"0260":[[],"","",["惊喜"],12,9],"0261":[[],"","",["生病"],17,26],"0262":[[],"","",["送月饼"],19,9],"0263":[[],"","",["吃东西"],27,20],"0264":[[],"","",["I-LOVE-YOU-"],7,8],"0265":[[],"","",["扔砖头"],0,11],"0266":[[],"","",["人呢"],14,1],"0267":[[],"","",["国庆"],4,0],"0268":[[],"","",["相亲相爱"],11,23],"0269":[[],"","",["苍天啊-"],20,24],"0270":[[],"","",["V5威武"],15,15],"0271":[[],"","",["喂"],16,2],"0273":[[],"","",["好饱啊"],6,5],"0274":[[],"","",["扎蛋糕"],8,17],"0275":[[],"","",["我倒"],26,7],"0276":[[],"","",["打盹"],23,14],"0277":[[],"","",["晃脚"],20,13],"0278":[[],"","",["惊恐"],23,14],"0279":[[],"","",["投降"],2,22],"0280":[[],"","",["撅屁股"],18,14],"0281":[[],"","",["蚊子飞郁闷"],25,13],"0282":[[],"","",["乖"],0,27],"0283":[[],"","",["挠痒痒"],13,10],"0284":[[],"","",["绿线镜子"],20,18],"0285":[[],"","",["第一名"],27,16],"0286":[[],"","",["亲元宝"],1,6],"0287":[[],"","",["喵"],8,10],"0288":[[],"","",["旋转狸"],24,13],"0289":[[],"","",["旋转桃"],14,6],"0290":[[],"","",["苦闷"],27,0],"0291":[[],"","",["游泳"],25,11],"0292":[[],"","",["篮球"],21,21],"0293":[[],"","",["揉眼"],3,5],"0294":[[],"","",["跑跳"],9,26],"0295":[[],"","",["点头"],24,15],"0296":[[],"","",["阿狸减肥"],19,27],"0297":[[],"","",["桃子唱歌"],17,18],"0298":[[],"","",["唱歌"],26,6],"0299":[[],"","",["买萌"],26,23],"0300":[[],"","",["戳"],17,0],"0301":[[],"","",["妈妈打电话"],20,22],"0302":[[],"","",["听电话"],9,22],"0303":[[],"","",["影子听音乐"],6,20],"0304":[[],"","",["偷听"],2,9],"0305":[[],"","",["做操"],28,25],"0306":[[],"","",["摇晃"],5,9],"0307":[[],"","",["抬头"],16,25],"0308":[[],"","",["打地鼠"],11,21],"0309":[[],"","",["羞媚"],11,22],"0310":[[],"","",["拉脸"],18,26],"0311":[[],"","",["恶魔"],14,3],"0312":[[],"","",["天使"],17,11],"0313":[[],"","",["耶耶"],19,14],"0314":[[],"","",["这个屌"],7,4],"0315":[[],"","",["啥？"],21,16],"0316":[[],"","",["囧"],6,27],"0317":[[],"","",["变帅"],15,8],"0318":[[],"","",["被砸"],19,15],"0319":[[],"","",["献花"],15,5],"0320":[[],"","",["恐慌"],0,5],"0321":[[],"","",["thanks"],17,20],"0322":[[],"","",["滑雪摔跤"],9,23],"0323":[[],"","",["吐舌头"],11,24],"0324":[[],"","",["圣诞快乐"],17,21],"0326":[[],"","",["元旦快乐"],7,21],"0327":[[],"","",["晕乎乎"],23,15],"0328":[[],"","",["永结同心"],19,17],"0329":[[],"","",["叹气"],9,3],"0330":[[],"","",["购物中"],19,7],"0331":[[],"","",["哇靠"],1,13],"0332":[[],"","",["洗澡"],21,19],"0333":[[],"","",["BIU-BIU"],9,6],"0334":[[],"","",["好冷"],8,6],"0335":[[],"","",["打拳击"],25,14],"0336":[[],"","",["浮云"],25,28],"0337":[[],"","",["得意"],25,20],"0338":[[],"","",["太好啦"],13,14],"0339":[[],"","",["WC急"],4,3],"0340":[[],"","",["愤怒啦"],18,12],"0341":[[],"","",["鸡肉卷"],21,9],"0342":[[],"","",["得瑟"],11,18],"0343":[[],"","",["啊啊啊啊啊哭"],22,2],"0344":[[],"","",["我倒"],18,21],"0345":[[],"","",["捂脸跑掉"],19,18],"0346":[[],"","",["吃饭去"],6,26],"0347":[[],"","",["哦啦啦"],9,22],"0348":[[],"","",["蹦擦擦"],21,6],"0349":[[],"","",["耍酷"],21,5],"0350":[[],"","",["-瞅来瞅去"],16,26],"0351":[[],"","",["新年好"],9,8],"0352":[[],"","",["回家过年啦"],10,25],"0353":[[],"","",["财源滚滚"],23,17],"0354":[[],"","",["舞狮子"],11,16],"0355":[[],"","",["红包拿来"],12,12],"0356":[[],"","",["给力"],21,18],"0357":[[],"","",["愤怒的阿狸"],22,27],"0358":[[],"","",["好牌"],18,12],"0359":[[],"","",["杀牌"],24,1],"0360":[[],"","",["回眸冷笑"],14,5],"0361":[[],"","",["元宵佳节"],5,9],"0362":[[],"","",["灰机"],28,1],"0363":[[],"","",["心动"],20,1],"0364":[[],"","",["叹息"],11,22],"0365":[[],"","",["发奋"],3,23],"0366":[[],"","",["人呢"],23,13],"0367":[[],"","",["得瑟的"],27,10],"0368":[[],"","",["摇啊摇"],1,0],"0369":[[],"","",["傻样儿"],12,5],"0370":[[],"","",["杯具了"],2,5],"0371":[[],"","",["跑来"],4,16],"0372":[[],"","",["吃饭"],21,21],"0373":[[],"","",["来一杯"],12,9],"0374":[[],"","",["醉了"],0,0],"0375":[[],"","",["挥手帕"],21,1],"0376":[[],"","",["照镜子"],26,2],"0377":[[],"","",["偷笑"],15,21],"0378":[[],"","",["扎针吧"],3,19],"0379":[[],"","",["掀桌"],25,25],"0380":[[],"","",["追心"],23,2],"0381":[[],"","",["被踩"],10,4],"0382":[[],"","",["冷静"],21,6],"0383":[[],"","",["劝说"],13,23],"0384":[[],"","",["爬树"],9,8],"0385":[[],"","",["捶桌笑"],16,22],"0386":[[],"","",["刷牙"],19,18],"0387":[[],"","",["双截棍"],28,11],"0388":[[],"","",["大熊happy"],5,17],"0389":[[],"","",["狸踏青"],22,0],"0390":[[],"","",["桃踏青"],1,5],"0391":[[],"","",["大熊-卷被"],14,6],"0392":[[],"","",["影子-卷被"],28,20],"0393":[[],"","",["卷被"],26,19],"0394":[[],"","",["桃子-卷被"],2,12],"0395":[[],"","",["卡米-卷被"],20,24],"0396":[[],"","",["不能说"],23,15],"0397":[[],"","",["洒泪"],12,11],"0398":[[],"","",["我是月光族"],4,17],"0399":[[],"","",["读书"],23,6],"0400":[[],"","",["耶"],22,11],"0401":[[],"","",["欢呼"],6,7],"0402":[[],"","",["看楼上"],19,13],"0403":[[],"","",["好兄弟"],17,1],"0404":[[],"","",["找抽"],5,6],"0405":[[],"","",["亮相"],23,4],"0406":[[],"","",["代表月亮"],8,23],"0407":[[],"","",["写信"],13,24],"0408":[[],"","",["有木有"],4,21],"0409":[[],"","",["冲啊"],10,3],"0410":[[],"","",["睡"],16,11],"0411":[[],"","",["变鸡肉卷"],16,14],"0412":[[],"","",["不淡定"],27,23],"0413":[[],"","",["可爱桃子"],15,21],"0414":[[],"","",["影子哭"],11,1],"0415":[[],"","",["喝饮料"],1,27],"0416":[[],"","",["美啦美啦"],18,22],"0417":[[],"","",["抓狂啊"],23,17],"0418":[[],"","",["歇会儿"],26,22],"0419":[[],"","",["大熊泪奔"],1,23],"0420":[[],"","",["米卡溜达"],2,25],"0421":[[],"","",["萌看"],27,8],"0422":[[],"","",["打包带走"],11,17],"0423":[[],"","",["风车"],8,19],"0424":[[],"","",["有问题"],9,12],"0425":[[],"","",["挨揍"],2,16],"0426":[[],"","",["拽裤裤"],8,18],"0427":[[],"","",["吻"],20,8],"0428":[[],"","",["对手指"],14,24],"0429":[[],"","",["不听"],13,19],"0430":[[],"","",["大熊困了"],26,21],"0431":[[],"","",["阿狸趴"],15,15],"0432":[[],"","",["桃子趴"],19,8],"0433":[[],"","",["我是花"],22,6],"0434":[[],"","",["欢呼"],18,6],"0435":[[],"","",["傻笑"],22,5],"0436":[[],"","",["棒棒糖"],28,17],"0437":[[],"","",["傻兮兮"],17,10],"0438":[[],"","",["追狸跑"],11,14],"0439":[[],"","",["好晒"],16,22],"0440":[[],"","",["禁"],13,11],"0441":[[],"","",["开动脑筋"],12,23],"0442":[[],"","",["扇扇子"],17,23],"0443":[[],"","",["坏笑"],4,27],"0444":[[],"","",["你"],23,13],"0445":[[],"","",["装可怜"],24,13],"0446":[[],"","",["动心"],23,20],"0447":[[],"","",["爱你"],28,28],"0448":[[],"","",["脸红了"],13,26],"0449":[[],"","",["尴尬"],5,26],"0450":[[],"","",["拍手"],5,22],"0452":[[],"","",["紧张"],27,19],"0453":[[],"","",["我喷"],10,27],"0454":[[],"","",["握手"],12,27],"0455":[[],"","",["非礼勿视"],3,7],"0456":[[],"","",["热"],1,5],"0457":[[],"","",["洗澡"],8,11],"0458":[[],"","",["呼啦圈"],10,15],"0459":[[],"","",["宠爱"],21,17],"0460":[[],"","",["毕业了"],7,25],"0461":[[],"","",["水啊"],9,20],"0462":[[],"","",["耶"],6,2],"0463":[[],"","",["阿狸水上漂"],9,10],"0464":[[],"","",["欢乐"],16,25],"0465":[[],"","",["跳绳"],20,15],"0466":[[],"","",["扯内裤"],28,8],"0467":[[],"","",["吃瓜"],9,16],"0468":[[],"","",["看热闹"],21,9],"0469":[[],"","",["数落"],26,0],"0470":[[],"","",["你妹"],22,28],"0471":[[],"","",["抠鼻"],23,0],"0472":[[],"","",["纳尼"],14,20],"0473":[[],"","",["惊讶"],1,0],"0474":[[],"","",["喊"],20,11],"0475":[[],"","",["挠"],2,24],"0476":[[],"","",["舔"],0,16],"0477":[[],"","",["没有钱"],24,7],"0478":[[],"","",["怎么办"],6,25],"0479":[[],"","",["拿玩偶"],3,2],"0480":[[],"","",["防暑大作战"],14,2],"0481":[[],"","",["献吻"],27,13],"0482":[[],"","",["飞吻"],18,22],"0483":[[],"","",["来看看"],17,10],"0484":[[],"","",["害羞"],13,16],"0485":[[],"","",["送花"],1,20],"0486":[[],"","",["嚼东西"],13,6],"0487":[[],"","",["哼"],9,27],"0488":[[],"","",["偷看"],22,9],"0489":[[],"","",["大熊草裙舞"],11,6],"0490":[[],"","",["拍蚊子"],2,13],"0491":[[],"","",["不要走"],16,19],"0492":[[],"","",["哇哇叫"],13,15],"0493":[[],"","",["抓狂"],20,27],"0494":[[],"","",["画个圈"],27,13],"0495":[[],"","",["叫我？"],11,10],"0496":[[],"","",["阳光"],5,4],"0497":[[],"","",["大雄刷牙"],4,4],"0498":[[],"","",["不嘛"],16,7],"0499":[[],"","",["招财猫"],28,18],"0500":[[],"","",["加油加油~"],28,18],"0501":[[],"","",["喊话"],23,4],"0502":[[],"","",["耶"],8,7],"0503":[[],"","",["空调病"],17,1],"0504":[[],"","",["影子放屁"],24,8],"0505":[[],"","",["打拳"],22,13],"0506":[[],"","",["中秋快乐"],4,20],"0507":[[],"","",["大熊脚踏车"],11,1],"0508":[[],"","",["强势路过"],1,19],"0509":[[],"","",["隆重介绍"],4,16],"0510":[[],"","",["我闪先"],5,17],"0512":[[],"","",["大熊滑板"],0,27],"0513":[[],"","",["求你了"],6,17],"0514":[[],"","",["哈哈哈"],0,26],"0515":[[],"","",["下厨"],12,21],"0516":[[],"","",["宠物"],2,22],"0517":[[],"","",["撞玻璃"],2,7],"0518":[[],"","",["阿狸吃蛋糕"],5,13],"0519":[[],"","",["粉刷"],0,15],"0520":[[],"","",["强吻"],25,21],"0522":[[],"","",["跳舞"],15,11],"0523":[[],"","",["眺望"],16,4],"0524":[[],"","",["又变帅"],22,5],"0525":[[],"","",["环球"],1,8],"0527":[[],"","",["撒花"],16,6],"0528":[[],"","",["睡懒觉"],14,20],"0530":[[],"","",["飘过"],22,17],"0531":[[],"","",["求妹子"],25,12],"0532":[[],"","",["玩铃铛"],19,5],"0533":[[],"","",["揪出来"],15,7],"0534":[[],"","",["大熊加油"],14,10],"0535":[[],"","",["剔牙"],15,8],"0536":[[],"","",["坏笑"],1,7],"0537":[[],"","",["折腾"],7,7],"0538":[[],"","",["思考者"],26,22],"0539":[[],"","",["对手指"],13,4],"0540":[[],"","",["骗吻"],19,17],"0541":[[],"","",["不给糖就捣乱"],3,23],"0542":[[],"","",["拽领结"],28,11],"0543":[[],"","",["灵魂出窍"],8,8],"0544":[[],"","",["抽风"],0,11],"0545":[[],"","",["骑扫把"],25,9],"0546":[[],"","",["倒"],11,17],"0547":[[],"","",["吃苹果"],7,5],"0548":[[],"","",["拍手"],17,8],"0549":[[],"","",["超人附体"],22,7],"0550":[[],"","",["发功"],17,23],"0551":[[],"","",["阿狸打电话"],19,26],"0552":[[],"","",["桃子打电话"],10,9],"0553":[[],"","",["抛媚眼"],14,24],"0555":[[],"","",["光棍"],26,20],"0556":[[],"","",["桃子下厨"],0,22],"0557":[[],"","",["信差"],28,7],"0558":[[],"","",["好冷"],4,9],"0559":[[],"","",["烤火"],10,25],"0560":[[],"","",["睡懒觉"],23,10],"0561":[[],"","",["健康歌"],5,5],"0562":[[],"","",["溜"],25,16],"0563":[[],"","",["课桌"],10,18],"0564":[[],"","",["炸弹"],22,17],"0565":[[],"","",["下雪了"],23,9],"0571":[[],"","",["热烈欢迎"],9,6],"0572":[[],"","",["梦游"],12,2],"0573":[[],"","",["女王驾到"],12,21],"0574":[[],"","",["趴趴熊"],20,13],"0575":[[],"","",["好好学习"],25,2],"0577":[[],"","",["拜托"],0,2],"0578":[[],"","",["我不听"],27,13],"0579":[[],"","",["影子叹气"],22,15],"0580":[[],"","",["我无语了"],27,13],"0581":[[],"","",["阿狸打雪仗"],11,12],"0582":[[],"","",["桃子打雪仗"],11,26],"0584":[[],"","",["等礼物"],9,20],"0585":[[],"","",["圣诞礼物"],10,7],"0586":[[],"","",["元旦快乐"],5,9],"0587":[[],"","",["好怕怕"],26,0],"0588":[[],"","",["吐白沫"],5,23],"0589":[[],"","",["冒冷汗"],9,13],"0590":[[],"","",["KO！"],13,15],"0591":[[],"","",["好衰啊"],20,25],"0592":[[],"","",["吐"],11,6],"0593":[[],"","",["欢呼"],21,22],"0594":[[],"","",["跪求"],21,5],"0595":[[],"","",["吐舌头"],5,28],"0596":[[],"","",["抽奖"],7,2],"0597":[[],"","",["一票难求"],28,16],"0598":[[],"","",["赶火车"],22,15],"0599":[[],"","",["发红包"],7,8],"0600":[[],"","",["年年有余"],19,6],"0601":[[],"","",["红包拿来"],6,14],"0602":[[],"","",["糖葫芦"],18,7],"0603":[[],"","",["滚雪球"],7,24],"0604":[[],"","",["嗑瓜子"],23,19],"0605":[[],"","",["打游戏"],21,24],"0606":[[],"","",["午睡中"],0,21],"0607":[[],"","",["羞羞脸"],6,24],"0608":[[],"","",["赏花灯"],23,16],"0609":[[],"","",["吃元宵"],9,8],"0610":[[],"","",["闹元宵"],16,23],"0611":[[],"","",["爱神之箭"],0,5],"0612":[[],"","",["丘比特"],21,23],"0613":[[],"","",["蹂躏"],3,22],"0614":[[],"","",["中箭了"],10,10],"0615":[[],"","",["我哭"],18,15],"0616":[[],"","",["跟我约会吧"],1,19],"0617":[[],"","",["约会去"],12,16],"0618":[[],"","",["love"],27,0],"0619":[[],"","",["送情书"],17,22],"0620":[[],"","",["收情书"],5,20],"0621":[[],"","",["集合啦"],12,2],"0622":[[],"","",["集合1"],12,6],"0623":[[],"","",["集合2"],8,28],"0624":[[],"","",["集合3"],19,18],"0625":[[],"","",["春游去"],11,12],"0626":[[],"","",["失眠"],15,8],"0627":[[],"","",["休息时间"],20,27],"0628":[[],"","",["馋肉"],19,21],"0629":[[],"","",["甩掉游泳圈"],22,1],"0630":[[],"","",["洗衣服"],17,26],"0631":[[],"","",["打伞"],25,15],"0632":[[],"","",["购物狂"],8,1],"0633":[[],"","",["苦力"],8,23],"0634":[[],"","",["有钱啦"],1,23],"0635":[[],"","",["告状"],22,10],"0638":[[],"","",["撒娇"],21,26],"0641":[[],"","",["等花开"],18,14],"0642":[[],"","",["吃饱才是王道"],26,20],"0643":[[],"","",["啃玉米"],11,6],"0644":[[],"","",["吃面"],7,21],"0645":[[],"","",["吸手指"],19,0],"0646":[[],"","",["扯纸"],27,15],"0647":[[],"","",["照相"],0,5],"0648":[[],"","",["手榴弹"],17,14],"0649":[[],"","",["剃毛"],24,0],"0650":[[],"","",["用眼神杀死你"],26,4],"0651":[[],"","",["阿狸弹琴"],2,3],"0654":[[],"","",["影子小提琴"],2,26],"0657":[[],"","",["蹦跶"],22,5],"0658":[[],"","",["花开"],24,12],"0659":[[],"","",["扭啊扭"],15,22],"0660":[[],"","",["我太帅了"],9,25],"0661":[[],"","",["锻炼身体"],16,8],"0662":[[],"","",["爱的光波"],22,14],"0663":[[],"","",["求包养"],26,20],"0664":[[],"","",["憋住"],4,16],"0665":[[],"","",["痒"],15,12],"0670":[[],"","",["流鼻涕"],6,23],"0671":[[],"","",["劳动节"],14,14],"0672":[[],"","",["我来了"],3,6],"0673":[[],"","",["修行"],3,20],"0674":[[],"","",["辛苦了"],7,2],"0675":[[],"","",["母亲节"],14,0],"0676":[[],"","",["戏水"],10,2],"0677":[[],"","",["压马路"],25,25],"0678":[[],"","",["批准"],6,13],"0679":[[],"","",["勿扰"],22,21],"0680":[[],"","",["咬他"],1,8],"0681":[[],"","",["大鸭梨"],7,7],"0682":[[],"","",["训斥"],28,14],"0683":[[],"","",["顶"],4,5],"0684":[[],"","",["喷香水"],13,22],"0685":[[],"","",["乖"],22,5],"0687":[[],"","",["烦人的蚊子"],0,19],"0688":[[],"","",["地铁"],7,10],"0689":[[],"","",["飞机表白"],17,11],"0690":[[],"","",["夏天真快乐"],11,11],"0691":[[],"","",["欢呼"],5,8],"0692":[[],"","",["奶瓶"],15,20],"0693":[[],"","",["礼物呢"],21,28],"0694":[[],"","",["滚铁环"],19,5],"0695":[[],"","",["玩弹弓"],7,1],"0696":[[],"","",["搬西瓜"],23,21],"0697":[[],"","",["切西瓜"],26,25],"0698":[[],"","",["吃西瓜"],0,0],"0699":[[],"","",["冰淇淋"],3,21],"0700":[[],"","",["好凉快"],18,13],"0701":[[],"","",["大风吹"],8,21],"0702":[[],"","",["淋雨中"],8,14],"0703":[[],"","",["太感动了"],17,25],"0704":[[],"","",["游泳"],12,19],"0705":[[],"","",["投降"],10,10],"0706":[[],"","",["船尾"],24,18],"0707":[[],"","",["桃子划船"],14,7],"0708":[[],"","",["影子划船"],0,16],"0709":[[],"","",["阿狸划船"],11,6],"0710":[[],"","",["米卡划船"],5,6],"0711":[[],"","",["大熊敲鼓"],3,8],"0712":[[],"","",["船头"],26,4],"0713":[[],"","",["阿狸吃粽子"],27,5],"0714":[[],"","",["桃子扔粽子"],28,14],"0715":[[],"","",["划龙舟"],15,4],"0716":[[],"","",["足球"],8,7],"0717":[[],"","",["排球"],8,7],"0718":[[],"","",["射箭"],0,2],"0719":[[],"","",["举重"],12,6],"0720":[[],"","",["击剑"],6,22],"0721":[[],"","",["跳水"],15,23],"0722":[[],"","",["帆板"],8,21],"0723":[[],"","",["体操"],10,21],"0724":[[],"","",["阿狸打乒乓球"],15,12],"0725":[[],"","",["米卡打乒乓球"],8,0],"0726":[[],"","",["篮球"],0,14],"0727":[[],"","",["曲棍球"],8,10],"0728":[[],"","",["拳击"],11,14],"0729":[[],"","",["水球"],5,19],"0730":[[],"","",["跨栏"],0,4],"0731":[[],"","",["接力"],1,8],"0732":[[],"","",["摔跤"],5,24],"0733":[[],"","",["铅球"],1,18],"0734":[[],"","",["上网也要好体格"],24,28],"0735":[[],"","",["跳水坑"],2,24],"0736":[[],"","",["牛郎织女"],17,27],"0737":[[],"","",["心气球"],26,17],"0738":[[],"","",["爱环绕"],5,14],"0739":[[],"","",["我最摇摆"],6,16],"0740":[[],"","",["不许迟到"],10,11],"0741":[[],"","",["不开心"],9,6],"0742":[[],"","",["上学去"],5,5],"0743":[[],"","",["请叫我红领巾"],22,9],"0744":[[],"","",["化学家"],15,25],"0745":[[],"","",["阿狸蹲"],18,14],"0746":[[],"","",["讲课"],0,26],"0747":[[],"","",["搭讪"],28,18],"0748":[[],"","",["追小鸡"],27,0],"0749":[[],"","",["站不住了"],10,12],"0750":[[],"","",["我美吗"],5,17],"0751":[[],"","",["眼保健操"],13,8],"0752":[[],"","",["翻滚"],3,20],"0753":[[],"","",["好开心"],9,28],"0754":[[],"","",["好无聊"],2,15],"0755":[[],"","",["转笔"],27,16],"0756":[[],"","",["悬挂"],11,0],"0757":[[],"","",["摇啊摇"],7,11],"0758":[[],"","",["大风"],2,16],"0759":[[],"","",["训小鸡"],4,15],"0760":[[],"","",["影子舞"],3,7],"0761":[[],"","",["国庆"],4,21],"0762":[[],"","",["一起吃月饼"],12,19],"0763":[[],"","",["做月饼"],24,22],"0764":[[],"","",["对眼"],22,5],"0765":[[],"","",["不要离开我"],24,10],"0766":[[],"","",["去旅游"],25,3],"0767":[[],"","",["妈我回来了"],1,5],"0768":[[],"","",["跳马舞"],11,10],"0769":[[],"","",["找东西"],28,20],"0770":[[],"","",["洗脸"],24,2],"0771":[[],"","",["得瑟"],26,3],"0772":[[],"","",["楼上的"],11,20],"0773":[[],"","",["发飙"],19,28],"0774":[[],"","",["恶作剧"],11,11],"0775":[[],"","",["跳绳"],1,24],"0776":[[],"","",["恋爱成就"],0,11],"0777":[[],"","",["出入平安"],11,7],"0778":[[],"","",["招财进宝"],5,0],"0779":[[],"","",["身体健康"],14,0],"0780":[[],"","",["万事如意"],21,16],"0781":[[],"","",["江南style"],6,26],"0782":[[],"","",["桃子骑马舞"],19,14],"0783":[[],"","",["三汗"],16,18],"0784":[[],"","",["吃螃蟹"],10,15],"0785":[[],"","",["得瑟的后果"],7,18],"0786":[[],"","",["不给糖就炸你"],15,27],"0787":[[],"","",["桃子撒糖"],5,22],"0788":[[],"","",["你的小裤裤"],28,13],"0789":[[],"","",["大熊脱光"],2,4],"0790":[[],"","",["甩卖"],8,2],"0791":[[],"","",["HERO"],6,15],"0792":[[],"","",["HEROINE"],14,17],"0793":[[],"","",["草裙舞"],27,19],"0794":[[],"","",["骑士"],8,9],"0795":[[],"","",["甩卖的后果"],9,0],"0796":[[],"","",["成仙"],28,14],"0797":[[],"","",["挂裤裤"],25,11],"0798":[[],"","",["寒风"],13,5],"0799":[[],"","",["揪肚皮"],8,18],"0800":[[],"","",["冲啊"],12,9],"0801":[[],"","",["吃苹果"],8,0],"0802":[[],"","",["笑掉大牙"],6,12],"0803":[[],"","",["魔术"],6,11],"0804":[[],"","",["太空步"],27,19],"0805":[[],"","",["感恩节大餐"],20,1],"0806":[[],"","",["画圈"],4,0],"0807":[[],"","",["遨游"],10,22],"0808":[[],"","",["丘比特"],15,14],"0809":[[],"","",["起飞"],19,10],"0810":[[],"","",["睡觉"],17,23],"0811":[[],"","",["穿内裤"],22,25],"0812":[[],"","",["大聚会"],12,26],"0813":[[],"","",["蘑菇"],0,20],"0814":[[],"","",["拍脸"],28,7],"0815":[[],"","",["泡澡"],1,0],"0816":[[],"","",["走你"],27,11],"0817":[[],"","",["下班啦"],12,12],"0818":[[],"","",["爱的传递"],2,7],"0819":[[],"","",["摇一摇"],7,16],"0820":[[],"","",["好困呀"],1,15],"0821":[[],"","",["圆蛋来了"],2,17],"0822":[[],"","",["堆雪人"],2,15],"0823":[[],"","",["麋鹿狸"],4,11],"0824":[[],"","",["圣诞树"],24,18],"0825":[[],"","",["末日来了"],2,23],"0827":[[],"","",["元旦快乐"],6,9],"0828":[[],"","",["小二舞"],1,3],"0829":[[],"","",["卖萌"],2,27],"0830":[[],"","",["震惊了"],21,15],"0831":[[],"","",["吃芥末"],3,28],"0832":[[],"","",["歪脖子"],5,12],"0833":[[],"","",["做鬼脸"],17,3],"0834":[[],"","",["顶小鸡"],10,20],"0835":[[],"","",["撑死了"],10,3],"0836":[[],"","",["跑起来"],19,15],"0837":[[],"","",["你不懂爱"],23,2],"0838":[[],"","",["好冷好冷"],24,27],"0839":[[],"","",["nonono"],7,8],"0840":[[],"","",["买票中"],12,3],"0841":[[],"","",["有毒气"],15,20],"0842":[[],"","",["不要嘛"],4,4],"0843":[[],"","",["千手观音"],2,18],"0844":[[],"","",["车票在手"],16,5],"0845":[[],"","",["狸在囧途"],18,14],"0846":[[],"","",["吃太多"],10,14],"0847":[[],"","",["王爷"],24,26],"0848":[[],"","",["战斗吧"],20,20],"0849":[[],"","",["说什么"],2,3],"0850":[[],"","",["法海大熊"],22,4],"0851":[[],"","",["拍飞"],5,20],"0852":[[],"","",["给跪了"],3,0],"0853":[[],"","",["拳击手"],17,27],"0854":[[],"","",["财源滚滚"],8,27],"0855":[[],"","",["招财进宝"],6,7],"0856":[[],"","",["鞭炮响"],10,25],"0857":[[],"","",["红包拿来"],3,25],"0858":[[],"","",["阿狸拜年"],11,15],"0859":[[],"","",["桃子拜年"],1,9],"0860":[[],"","",["新年快乐"],26,0],"0861":[[],"","",["过年加班"],10,12],"0862":[[],"","",["相亲大会"],18,9],"0863":[[],"","",["约会吧"],4,5],"0864":[[],"","",["爱的魔术"],4,10],"0865":[[],"","",["情人节"],14,26],"0866":[[],"","",["元宵节"],25,20],"0867":[[],"","",["肥狸"],20,16],"0868":[[],"","",["不要啊"],19,14],"0869":[[],"","",["懒觉"],20,23],"0870":[[],"","",["起床啦"],3,12],"0871":[[],"","",["雾霾"],11,11],"0872":[[],"","",["扇子舞"],0,23],"0873":[[],"","",["边吃边睡"],7,3],"0874":[[],"","",["又在卖萌"],8,24],"0875":[[],"","",["奏凯"],26,6],"0876":[[],"","",["植树节"],20,28],"0877":[[],"","",["迟到啦"],12,15],"0878":[[],"","",["桑巴舞"],21,11],"0879":[[],"","",["飞吻"],5,21],"0880":[[],"","",["舒服么"],24,26],"0881":[[],"","",["生日快乐"],14,9],"0882":[[],"","",["桃子亮相"],1,20],"0883":[[],"","",["大熊倒地"],17,26],"0884":[[],"","",["米卡登场"],15,23],"0885":[[],"","",["天才影子"],5,7],"0886":[[],"","",["心气球米卡"],17,26],"0887":[[],"","",["超人熊"],16,24],"0888":[[],"","",["吃春卷"],6,20],"0889":[[],"","",["影子看书"],7,9],"0890":[[],"","",["不可以"],11,17],"0891":[[],"","",["阿狸木乃伊"],27,13],"0892":[[],"","",["大熊木乃伊"],15,23],"0893":[[],"","",["影子木乃伊"],21,2],"0894":[[],"","",["钓愚"],1,23],"0896":[[],"","",["俯卧撑"],21,0],"0897":[[],"","",["恍然大悟"],10,12],"0898":[[],"","",["空降"],14,28],"0899":[[],"","",["风车"],18,8],"0900":[[],"","",["扭扭舞"],2,6],"0901":[[],"","",["揪住了"],2,22],"0902":[[],"","",["不理睬"],22,6],"0903":[[],"","",["彩蛋"],24,14],"0904":[[],"","",["米卡哦耶"],6,4],"0905":[[],"","",["呼啦圈"],15,13],"0906":[[],"","",["请假"],7,1],"0907":[[],"","",["如来神掌"],28,0],"0908":[[],"","",["捉急"],19,19],"0909":[[],"","",["多金"],28,6],"0910":[[],"","",["大熊蹲"],16,21],"0911":[[],"","",["救援"],19,4],"0912":[[],"","",["禽流感"],15,14],"0913":[[],"","",["大扫除"],24,16],"0914":[[],"","",["你不行"],17,12],"0915":[[],"","",["偶的小心脏"],3,12],"0916":[[],"","",["喷"],28,23],"0917":[[],"","",["痒痒"],4,16],"0920":[[],"","",["偷偷"],16,11],"0921":[[],"","",["母亲节礼物"],14,28],"0922":[[],"","",["biu"],19,26],"0923":[[],"","",["快到碗里来"],17,15],"0924":[[],"","",["晕乎乎"],1,28],"0925":[[],"","",["撞脸"],22,20],"0926":[[],"","",["钢铁狸"],10,17],"0927":[[],"","",["打米卡"],7,10],"0928":[[],"","",["换个大碗来"],20,19],"0929":[[],"","",["钱掉了"],7,12],"0930":[[],"","",["求解释"],18,1],"0931":[[],"","",["放开我"],16,28],"0932":[[],"","",["大哭"],1,26],"0933":[[],"","",["炸米卡"],1,11],"0934":[[],"","",["送礼物"],26,7],"0935":[[],"","",["大熊献声"],19,23],"0936":[[],"","",["礼物呢"],28,9],"0937":[[],"","",["吹泡泡"],5,16],"0938":[[],"","",["拍小鸡"],9,20],"0939":[[],"","",["加油桃子"],16,17],"0940":[[],"","",["买糖归来"],12,14],"0941":[[],"","",["顶粽子"],25,3],"0942":[[],"","",["要粽子"],18,19],"0943":[[],"","",["米卡得瑟"],21,28],"0944":[[],"","",["伤心"],11,20],"0945":[[],"","",["早"],21,13],"0946":[[],"","",["溜达"],8,16],"0947":[[],"","",["雪糕"],18,10],"0948":[[],"","",["蹦擦擦"],25,0],"0949":[[],"","",["吃货熊"],10,7],"0950":[[],"","",["好样的"],7,13],"0951":[[],"","",["快开饭"],27,3],"0952":[[],"","",["吃西瓜"],12,13],"0953":[[],"","",["排球"],25,20],"0954":[[],"","",["顶"],10,22],"0955":[[],"","",["签到"],14,2],"0956":[[],"","",["热死了"],7,28],"0957":[[],"","",["不画啦"],7,22],"0958":[[],"","",["够不到啊"],22,6],"0959":[[],"","",["抄不到啊"],18,13],"0960":[[],"","",["偷笑"],13,4],"0961":[[],"","",["被K"],28,24],"0962":[[],"","",["需要冰能量"],16,15],"0963":[[],"","",["体重"],12,27],"0964":[[],"","",["转晕"],14,1],"0965":[[],"","",["拜拜"],16,16],"0966":[[],"","",["雪糕流眼泪"],1,25],"0967":[[],"","",["好紧张"],22,10],"0968":[[],"","",["该吃药了"],28,19],"0969":[[],"","",["打劫"],26,9],"0970":[[],"","",["双手赞成"],10,21],"0971":[[],"","",["别追我"],16,1],"0972":[[],"","",["好想吃"],1,7],"0973":[[],"","",["吹空调"],28,15],"0974":[[],"","",["吹牛"],4,19],"0975":[[],"","",["踢腿舞"],5,7],"0976":[[],"","",["潜水被抓"],21,2],"0977":[[],"","",["灌水"],13,25],"0978":[[],"","",["桃子心"],8,0],"0979":[[],"","",["洗内裤"],13,22],"0980":[[],"","",["扭起来"],13,19],"0981":[[],"","",["都是压力啊"],15,20],"0982":[[],"","",["嬉水"],18,3],"0983":[[],"","",["没心情"],4,4],"0984":[[],"","",["拍死蚊子"],0,16],"0985":[[],"","",["在哪？"],16,20],"0987":[[],"","",["吃西瓜"],23,19],"0988":[[],"","",["LOVE"],21,26],"0989":[[],"","",["热死啦"],23,15],"0990":[[],"","",["敬礼"],4,8],"0991":[[],"","",["七夕送花"],7,15],"0992":[[],"","",["流口水"],20,19],"0993":[[],"","",["滚"],13,12],"0994":[[],"","",["健身操"],9,22],"0995":[[],"","",["我困了"],19,28],"0996":[[],"","",["惊喜"],9,21],"0997":[[],"","",["奔跑的大熊"],1,15],"0998":[[],"","",["怨气"],5,20],"0999":[[],"","",["面湖思过"],25,0],"1000":[[],"","",["破冰"],0,7],"1001":[[],"","",["赶作业"],12,20],"1002":[[],"","",["让我想想"],21,26],"1003":[[],"","",["翘起地球"],3,8],"1004":[[],"","",["意念"],25,2],"1005":[[],"","",["教师节"],20,11],"1006":[[],"","",["立正"],2,0],"1007":[[],"","",["Fox"],21,18],"1008":[[],"","",["吃月饼"],22,16],"1009":[[],"","",["打瞌睡"],9,18],"1010":[[],"","",["秋天来了"],22,0],"1011":[[],"","",["国庆吹号"],27,15],"1012":[[],"","",["我伙呆"],18,16],"1013":[[],"","",["何弃疗"],23,10],"1014":[[],"","",["人干事"],4,27],"1015":[[],"","",["尾巴"],5,28],"1016":[[],"","",["累觉不爱"],11,22],"1017":[[],"","",["啦啦啦"],20,15],"1018":[[],"","",["流星"],28,22],"1019":[[],"","",["说闹觉余"],5,2],"1020":[[],"","",["十动然拒"],21,0],"1021":[[],"","",["不"],13,3],"1022":[[],"","",["再见"],22,1],"1023":[[],"","",["打包"],21,21],"1024":[[],"","",["没钱了"],15,23],"1025":[[],"","",["不明觉厉"],9,26],"1026":[[],"","",["下雪了"],18,12],"1027":[[],"","",["摇尾巴"],24,12],"1028":[[],"","",["心碎了"],18,28],"1029":[[],"","",["一点也不冷"],12,21],"1030":[[],"","",["你们欺负我"],26,25],"1031":[[],"","",["爸爸去哪儿"],26,25],"1032":[[],"","",["木桶浴"],14,3]};

if (typeof exports === 'object') {
  module.exports = ali;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return ali; });
} else {
  this.ali = ali;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());