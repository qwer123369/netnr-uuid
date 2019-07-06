/*
 * uuid
 * 2019-07
 * 
 * by netnr
 * 
 * https://gitee.com/netnr/uuid
 * https://github.com/netnr/uuid
 */

(function (window) {

    var uuid = function (ops) {
        return new uuid.fn.init(ops);
    }

    uuid.fn = uuid.prototype = {
        //初始化
        init: function (ops) {
            ops = ops || {};
            //容器
            this.id = ops.id || document.querySelector(".uuidbox");
            //git托管
            this.githost = ops.githost;
            if (!this.githost) {
                var hts = location.host.split('.');
                if (hts.length == 3) {
                    this.githost = hts[0];
                } else {
                    this.githost = "github";
                }
            }
            if (["github", "gitee"].indexOf(this.githost) == -1) {
                this.showMessage("This git hosting is not supported");
                return;
            }
            //缓存
            this.dataCache = {};

            var lpn = location.pathname;
            switch (lpn) {
                //fork
                case "_fork":
                    this.name = "netnr";
                    this.repos = "uuid";

                    this.nr = this.name + "/" + this.repos;

                    this.forkList();
                    break;
                default:
                    var pns = lpn.split('/');
                    //账号
                    this.name = ops.name || (pns[1] == "" ? "netnr" : pns[1]);
                    this.name = this.name == "index.html" ? "netnr" : this.name;
                    //仓库
                    this.repos = ops.repos || ((!pns[2] || pns[2] == "") ? "uuid" : pns[2]);
                    //包
                    this.libs = ops.libs || ((!pns[3] || pns[3] == "") ? "libs" : pns[3]);

                    this.nr = this.name + "/" + this.repos;

                    this.info();

                    this.build();
            }

            this.jump();

            return this;
        },
        //获取用户
        getUser: function (callback) {
            var src = "https://api.github.com/users/" + this.name;
            switch (this.githost) {
                case "gitee":
                    src = "https://gitee.com/api/v5/users/" + this.name;
                    break;
            }
            uuid.fetch(this.name, src, callback, "text");
        },
        //获取仓库
        getRepos: function (callback) {
            var that = this;
            var src = "https://api.github.com/repos/" + this.nr;
            switch (this.githost) {
                case "gitee":
                    src = "https://gitee.com/api/v5/repos/" + this.nr;
                    break;
            }
            uuid.fetch(this.name, src, callback, 'json', function () {
                that.showMessage("Not found");
            })
        },
        //获取目录
        getDir: function (callback) {
            var that = this;
            var src = "https://api.github.com/repos/" + this.nr + "/contents/" + this.libs;
            switch (this.githost) {
                case "gitee":
                    src = "https://gitee.com/api/v5/repos/" + this.nr + "/git/trees/master?recursive=1";
                    break;
            }
            uuid.fetch(this.name, src, callback, 'json', function () {
                that.showMessage("Not found");
            })
        },
        //获取分支
        getFork: function (callback) {
            var that = this;
            var src = "https://api.github.com/repos/" + this.nr + "/forks";
            switch (this.githost) {
                case "gitee":
                    src = "https://gitee.com/api/v5/repos/" + this.nr + "/forks?sort=newest&page=1&per_page=30";
                    break;
            }
            uuid.fetch(this.name, src, callback, 'json', function () {
                that.showMessage("Not found");
            })
        },
        //显示fork列表
        forkList: function () {
            var that = this;
            document.title += "-fork";
            this.getFork(function (data) {

                if (data.length) {
                    that.id.innerHTML = '<h2 class="text-center mt-3">Fork</h2><hr/>';
                }

                data.forEach(function (item) {
                    var icon = item.owner.avatar_url;
                    var name = item.owner.login;

                    var cf = document.createElement("div");
                    cf.className = "card-fork";
                    cf.innerHTML = '<a href="' + location.origin + '/' + name + '"><img data-src="' + icon + '" src="' + uuid.defaultFavicon + '" /><br/>' + name + '</a>';
                    that.id.appendChild(cf);

                    var cfimg = cf.getElementsByTagName('img')[0];
                    var img = new Image();
                    img.src = cfimg.getAttribute('data-src');
                    img.onload = function () { cfimg.src = this.src }
                })

                if (data.length) {
                    var morefork = "https://github.com/" + that.nr + "/network/members";
                    switch (that.githost) {
                        case "gitee":
                            morefork = "https://gitee.com/" + that.nr + "/members";
                            break;
                    }

                    var cf = document.createElement("div");
                    cf.className = "card-fork";
                    cf.innerHTML = '<a href="' + morefork + '"><img src="/favicon.svg" /><br/>More fork</a>';
                    that.id.appendChild(cf);
                } else {
                    that.showMessage('No fork')
                }
            })
        },
        //个人信息
        info: function () {
            var that = this;
            var ind = document.createElement("div");
            ind.className = "mt-3 mb-4";
            this.id.appendChild(ind);
            this.getUser(function (data) {
                data = JSON.parse(data);
                if (!data.login) {
                    return;
                }

                document.title = data.login + " - " + document.title;

                var nhref = "https://" + that.githost + ".com/";

                var indhtm = [];
                indhtm.push('<img class="uphoto" src="' + data.avatar_url + '" onerror="this.src=\'favicon.svg\';this.onerror=null;" />');
                indhtm.push('<a class="text-muted h4" href="' + nhref + data.login + '">' + data.login + '</a><br/>');
                if (data.blog) {
                    indhtm.push('<a class="small" href="' + data.blog + '">' + data.blog + '</a>');
                } else {
                    indhtm.push('<a class="small text-muted">no blog</a>');
                }
                ind.innerHTML = indhtm.join('');

                that.search();

                //fork按钮
                that.getRepos(function (data) {
                    var btn = document.createElement('a');
                    btn.href = location.origin + "/_fork";
                    btn.className = "badge badge-info float-right";
                    btn.style.fontSize = "1rem";
                    btn.innerHTML = 'Fork &nbsp;' + data.forks_count;
                    ind.insertBefore(btn, ind.firstChild);
                })
            })
        },
        //搜索
        search: function () {
            var that = this;
            var sh = document.createElement("input");
            sh.className = "form-control form-control-sm mt-2";
            sh.style.width = "55%";
            sh.placeholder = "搜索，支持静默搜索";
            sh.oninput = function () {
                var key = this.value.toLowerCase();
                var cb = that.id.getElementsByClassName('card-body');
                for (var i = 0; i < cb.length; i++) {
                    var anode = cb[i].getElementsByTagName('a'), hasa = 0;
                    for (var j = 0; j < anode.length; j++) {
                        var anj = anode[j];
                        if (anj.href.toLowerCase().indexOf(key) >= 0 || anj.innerHTML.toLowerCase().indexOf(key) >= 0) {
                            anj.style.display = "";
                            hasa = 1;
                        } else {
                            anj.style.display = "none";
                        }
                    }
                    cb[i].parentNode.style.display = hasa ? "" : "none";
                }
            }
            sh.title = "静默搜索，支持快捷方式：Esc、↑、↓、Enter，可直接打开网址";
            that.id.firstChild.appendChild(sh);
        },
        //跳转
        jump: function () {
            var that = this;
            //静默搜索
            that.dataCache.jumpkey = that.dataCache.jumpkey || "";

            window.addEventListener('keypress', function (e) {
                if (document.activeElement.nodeName != "INPUT") {
                    if (that.dataCache.jumpkey.length < 28) {
                        that.dataCache.jumpkey += String.fromCharCode(e.keyCode);
                    }
                    that.jumpView();
                }
            });
            window.addEventListener('keydown', function (e) {
                if (document.activeElement.nodeName != "INPUT") {
                    switch (e.keyCode) {
                        //退格
                        case 8:
                            if (that.dataCache.jumpkey != "") {
                                that.dataCache.jumpkey = that.dataCache.jumpkey.substring(0, that.dataCache.jumpkey.length - 1);
                            }
                            that.jumpView();
                            uuid.stopDefault(e);
                            break;
                        //回车
                        case 13:
                            var openuri = that.jumpnode.firstChild.innerText;
                            var ali = that.jumpnode.getElementsByClassName('active')[0];
                            if (ali) {
                                openuri = ali.firstChild.innerText;
                            }
                            if (openuri.indexOf('.') == -1) {
                                var dq = "https://www.baidu.com/s?&wd=";
                                openuri = dq + encodeURIComponent(openuri);
                            } else if (openuri.toLowerCase().indexOf("http") != 0) {
                                openuri = "http://" + openuri;
                            }
                            that.dataCache.jumpkey = "";
                            that.jumpView();
                            uuid.stopDefault(e);
                            window.open(openuri.trim());
                            break;
                        //ESC
                        case 27:
                            that.dataCache.jumpkey = "";
                            that.jumpView();
                            uuid.stopDefault(e);
                            break;
                        //up
                        case 38:
                        //down
                        case 40:
                            var ali = that.jumpnode.getElementsByClassName('active')[0];
                            if (ali) {
                                var newli;
                                e.keyCode == 38 && (newli = ali.previousSibling);
                                e.keyCode == 40 && (newli = ali.nextSibling);
                                if (newli) {
                                    newli.className = "active";
                                    ali.className = "";
                                }
                                uuid.stopDefault(e);
                            }
                            break;
                    }
                }
            })
        },
        //跳转显示
        jumpView: function () {
            var that = this;
            if (!that.jumpnode) {
                var jv = document.createElement('div');
                jv.className = "uuidjump";
                document.body.appendChild(jv);
                jv.onclick = function (e) {
                    e = e || window.event;
                    var target = e.target || e.srcElement;
                    var lis = this.getElementsByTagName('li');
                    for (var j = 0; j < lis.length; j++) {
                        if (lis[j].contains(target)) {
                            window.open(lis[j].firstChild.innerText.trim());
                            that.dataCache.jumpkey = "";
                            that.jumpView();
                            break;
                        }
                    }
                }
                jv.autopost = function () {
                    jv.style.left = (document.documentElement.clientWidth / 2 - jv.clientWidth / 2) + "px";
                };
                jv.autopost();
                window.addEventListener('resize', jv.autopost);
                that.jumpnode = jv;
            }
            if (that.dataCache.jumpkey.trim() != "") {
                that.jumpnode.style.display = "";
                var htm = [], cn = 0;
                for (var i = 0; i < document.links.length; i++) {
                    if (cn > 6) {
                        break;
                    }
                    var link = document.links[i];
                    if (link.href.toLowerCase().indexOf(that.dataCache.jumpkey.toLowerCase()) >= 0 || link.innerText.toLowerCase().indexOf(that.dataCache.jumpkey.toLowerCase()) >= 0) {
                        cn++;
                        if (htm.length) {
                            htm.push('<li>')
                        } else {
                            htm.push('<li class="active">')
                        }
                        var jicon = link.firstChild.src || uuid.defaultFavicon;
                        htm.push('<div class="text-info"><img src="' + jicon + '" onerror="this.src=\'' + uuid.defaultFavicon + '\';this.onerror=null;" />' + link.href + '</div>')
                        htm.push('<div>' + link.innerText + '</div>')
                        htm.push('</li>')
                    }
                }
                var jnhtml = '<div class="h4 py-1 px-3">' + that.dataCache.jumpkey + '</div>';
                if (htm.length) {
                    jnhtml = jnhtml + "<ul>" + htm.join('') + "</ul>";
                }
                that.jumpnode.innerHTML = jnhtml;
                that.jumpnode.autopost();
            } else {
                that.jumpnode.style.display = "none";
                that.jumpnode.innerHTML = "";
            }
        },
        //构建
        build: function () {
            var that = this;
            that.getDir(function (data) {
                //缓存
                that.dataCache.dir = data;
                switch (that.githost) {
                    case "gitee":
                        data = data.tree;
                        break;
                }

                var hasfile = false;
                //遍历目录
                data.forEach(function (item) {
                    //是文件
                    var isfile = false;
                    switch (that.githost) {
                        case "github":
                            isfile = item.type == "file";
                            break;
                        case "gitee":
                            isfile = (item.type == "blob" && item.path.indexOf(that.libs + "/") == 0);
                            break;
                    }
                    if (isfile) {
                        hasfile = true;

                        //card 标题，标题链接,文件链接
                        var type, typelink, filesrc;
                        switch (that.githost) {
                            case "github":
                                type = item.name.substr(0, item.name.lastIndexOf('.'));
                                typelink = item.html_url;
                                filesrc = item.download_url;
                                break;
                            case "gitee":
                                type = item.path.substr(0, item.path.lastIndexOf('.')).substring(that.libs.length + 1);
                                typelink = "https://gitee.com/" + that.name + "/" + that.repos + "/blob/master/" + that.libs + "/" + type + ".md";
                                filesrc = item.url;
                                break;
                        }

                        //创建卡片
                        var card = document.createElement("div");
                        card.className = "card border-success my-3";

                        var cardhtml = [];
                        cardhtml.push('<div class="card-header border-success"><a href="' + typelink + '" >' + type + '</a></div>');
                        cardhtml.push('<div class="card-body">');
                        cardhtml.push('<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>');
                        cardhtml.push('</div>');

                        card.innerHTML = cardhtml.join('');
                        //显示卡片
                        that.id.appendChild(card);

                        //加载卡片下的链接，一个卡片对应一个文件
                        uuid.fetch(that.name, filesrc, function (data) {
                            switch (that.githost) {
                                case "gitee":
                                    {
                                        data = decodeURIComponent(escape(atob(JSON.parse(data).content)));
                                    }
                                    break;
                            }
                            var list = data.split('\n');
                            var ahtm = [];
                            //遍历每一行，解析成A标签
                            list.forEach(function (line) {
                                //满足Markdown的链接格式，有效行
                                if (/\[.*?\]\(http.*?\)/.test(line)) {
                                    //A标签显示的文本、图标、链接
                                    var atext, aicon, ahref;
                                    line.replace(/\(http.*?\)/, function (x) {
                                        ahref = x.substring(1, x.length - 1).trim();
                                    })
                                    line.replace(/\[.*?\]/, function (x) {
                                        atext = x.substring(1, x.length - 1).trim();
                                    })
                                    atext.replace(/ http.*/, function (x) {
                                        atext = atext.replace(x, "");
                                        aicon = x.trim();
                                    })
                                    if (!aicon) {
                                        var hrefs = ahref.split('/');
                                        aicon = hrefs[0] + "//" + hrefs[2] + "/favicon.ico";
                                    }
                                    ahtm.push('<a href="' + ahref + '"><img data-src="' + aicon + '" src="' + uuid.defaultFavicon + '"/> ' + atext + '</a>');
                                }
                            })
                            card.lastChild.innerHTML = ahtm.join('');

                            //加载图标
                            var cardimg = card.lastChild.getElementsByTagName('img');
                            for (var i = 0; i < cardimg.length; i++) {
                                var img = new Image();
                                img.that = cardimg[i];
                                img.onload = function () { this.that.src = this.src; };
                                img.onerror = function () { this.that.src = uuid.defaultFavicon; this.onerror = null; };
                                var iconsrc = img.that.getAttribute('data-src');
                                //代理http图片请求为https
                                img.src = iconsrc.replace("http://", "https://proxy.zme.ink/");
                            }
                        }, 'text');
                    }
                });
                //为空时
                if (!hasfile) {
                    that.showMessage("Is empty");
                } else {
                    var cp = document.createElement("p");
                    cp.className = "small text-muted";
                    if (uuid.iscache) {
                        cp.innerHTML = '当前信息从本地读取，<span class="text-primary" style="cursor:pointer" onclick="uu.cacheClear()">刷新</span>';
                    }
                    that.id.appendChild(cp);
                }
            })
        },
        //显示消息
        showMessage: function (msg) {
            var h2 = document.createElement('h2');
            h2.className = "text-danger text-center my-5";
            h2.innerHTML = msg;
            this.id.appendChild(h2)
        },
        //清除当前用户的本地存储
        cacheClear: function () {
            uuid.cacheClear(this.name);
        }
    }

    uuid.fn.init.prototype = uuid.fn;

    //默认的图标
    uuid.defaultFavicon = "/src/net.svg";

    /**
     * 阻止默认行为
     * @param {any} e
     */
    uuid.stopDefault = function (e) {
        if (e && e.preventDefault) {
            e.preventDefault()
        } else {
            window.event.returnValue = false
        }
    };

    /**
     * 获取本地存储记录
     * @param {any} name 账号
     * @param {any} key 键
     */
    uuid.cacheGet = function (name, key) {
        var result = { ok: false, value: null };

        var udata = localStorage.getItem("uuid_" + name);
        if (udata && udata != "") {
            var ujson = JSON.parse(udata);
            //缓存30分钟
            result.ok = new Date().valueOf() - ujson["__create_time__" + key] < 1000 * 60 * 30;
            //值
            result.value = ujson[key];
        }
        return result;
    };

    /**
     * 设置本地存储记录
     * @param {any} name 账号
     * @param {any} key 键
     * @param {any} value 值
     */
    uuid.cacheSet = function (name, key, value) {
        var udata = localStorage.getItem("uuid_" + name);
        var ujson = {};
        if (udata && udata != "") {
            ujson = JSON.parse(udata);
        }
        ujson["__create_time__" + key] = new Date().valueOf();
        ujson[key] = value;
        localStorage.setItem("uuid_" + name, JSON.stringify(ujson));
    };

    /**
     * 清除当前用户的本地存储
     * @param {any} name 账号
     */
    uuid.cacheClear = function (name) {
        localStorage.removeItem("uuid_" + name);
        location.reload(false);
    }

    /**
     * /**
     * 请求
     * @param {any} name 账号
     * @param {any} src 链接
     * @param {any} callback 回调
     * @param {any} dataType 数据类型
     * @param {any} error 错误回调
     */
    uuid.fetch = function (name, src, callback, dataType, error) {
        //优先取缓存
        var cg = uuid.cacheGet(name, src);
        if (cg.ok && cg.value) {
            uuid.iscache = true;
            callback(cg.value);
        } else {
            fetch(src)
                .then(x => x[dataType]())
                .then(function (data) {
                    uuid.iscache = false;
                    callback(data);
                    uuid.cacheSet(name, src, data);
                }).catch(function (e) {
                    if (cg.value) {
                        uuid.iscache = true;
                        callback(cg.value);
                    } else {
                        error && error(e);
                    }
                })
        }
    }

    window.uuid = uuid;

})(window);

var uu = uuid({ githost: "gitee" });