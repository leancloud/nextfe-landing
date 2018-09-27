const BASE_URL = 'http://lcmidserver.leanapp.cn/3.0';
const LIST_ID = '248ba7cad4';
const tplMap = {
  indexTpl: `
          {{if des }}
            <article class="des">
                {{each des}}
                  <p> {{des[$index]}} </p>
                {{/each}}
            </article>
          {{/if}}
          {{if hasworker}}
            <article>
              <span class="button">工作机会</span>
            </article>
          {{/if}}
          {{each title}}
            <article>
                {{if imgs}}
                  <div class="content-img">
                    <img src="{{imgs[$index]}}">
                  </div>
                {{/if}}
                <div class=" {{if imgs}}content-text{{/if}}">
                <a href="{{link[$index]}}" target="_blank"><h4>{{title[$index]}}</h4></a>
                  <p>{{content[$index]}}</p>
                  <a href="{{link[$index]}}" target="_blank">
                  {{link[$index] | url}}</a>
                </div>
            </article>
          {{/each}}`,
  pagenationTpl: `
              <span class="page-button pre" onClick="prePage({{current-1}})">上一页</span>
              <span>{{current}}/{{total}}</span>
              <span class="page-button next" onClick="nextPage({{current+1}})">下一页</span>`
};

function Utils() {
  this.baseurl = BASE_URL;
  this.AjaxBeforeSend = (request) => {
    request.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
    request.setRequestHeader('X-Proxy-Field', 'mailchimp');
    request.setRequestHeader('Accept', 'application/json');
    return request;
  };
}
Utils.prototype.http = function http(url, data = {}, method = 'GET') {
  const pro = $.Deferred();
  $.ajax({
    type: method,
    data,
    url: `${this.baseurl}${url}`,
    beforeSend: this.AjaxBeforeSend,
    success: (result) => {
      pro.resolve(result);
    },
    error: (err) => {
      pro.reject(err);
    }
  });
  return pro.promise();
};
Utils.prototype.startWith = function startWith(string, str) {
  if (
    str == null ||
    string == null ||
    str === '' ||
    string.length === 0 ||
    str.length > string.length
  ) {
    return false;
  }
  if (string.substr(0, str.length) === str) {
    return true;
  }
  return false;
};
Utils.prototype.checkURL = function checkURL(URL) {
  // eslint-disable-next-line
  const objExp = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
  return objExp.test(URL);
};
Utils.prototype.checkEmail = function checkEmail(email) {
  const reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
  return reg.test(email);
};
Utils.prototype.plainText = function plainText(text) {
  const textArr = text.split('\n\n===')[0].split('工作机会');
  const content = textArr[0].split('\n\n');
  const contentResult = {
    title: [],
    content: [],
    link: []
  };
  content.forEach((v) => {
    v.split('\n').forEach((valstr) => {
      const value = valstr
        .replace(/^-*/, '')
        .replace(/^\*\|[\s\S]*\|\*$/, '');
      if (value && value.indexOf('点击') < 0 && value.length > '** '.length) {
        if (this.checkURL(value)) {
          contentResult.link.push(value);
        } else if (this.startWith(value, '** ')) {
          contentResult.title.push(value.replace('** ', ''));
        } else if (value) {
          contentResult.content.push(value);
        }
      }
    });
  });
  const workerresult = {
    title: [],
    content: [],
    link: []
  };
  if (textArr[1]) {
    const worker = textArr[1].split('\n\n');
    worker.forEach((v) => {
      const arr = v.split('\n');
      arr.forEach((data) => {
        if (data.indexOf('——') > -1) {
          workerresult.title.push(data);
        } else if (/^\d*K-\d*K/.test(data) || data.indexOf('全职') > -1 || data.indexOf('兼职') > -1) {
          workerresult.content.push(data);
        } else if (this.checkURL(data)) {
          // eslint-disable-next-line
          const objExp = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
          workerresult.link.push(data.match(objExp)[0]);
        }
      });
    });
  }
  return {
    contentResult,
    workerresult
  };
};

const util = new Utils();
/**
 * 获取推送信息
 * @param {*} nextpage 页数
 */

function GetCampaigns(nextpage = 1) {
  $('main').loading('start');
  $('body').loading('stop');
  const pagenation = {
    count: 1, // 每页间隔
    offset: 0
  };
  if (typeof nextpage === 'number' && nextpage > 0) {
    pagenation.current = nextpage;
    pagenation.offset = (nextpage - 1) * pagenation.count;
  } else {
    pagenation.current = 1;
  }
  util
    .http('/campaigns', {
      sort_field: 'send_time',
      sort_dir: 'DESC',
      status: 'sent',
      list_id: LIST_ID,
      count: pagenation.count,
      offset: pagenation.offset
    })
    .then((data) => {
      const id = data.campaigns[0].id || '';
      pagenation.total = data.total_items || 0;
      if (id) {
        return util.http(`/campaigns/${id}/content`);
      }
      throw Error('id is require');
    })
    .then((data) => {
      if (data && data.plain_text) {
        const text = util.plainText(data.plain_text);
        if (text && text.contentResult) {
          if (data.html) {
            text.contentResult.imgs = [];
            const imgs = $('img', $(data.html));
            if (imgs.length > 0) {
              imgs.each((index, ele) => {
                if (index !== 0) {
                  text.contentResult.imgs.push($(ele)[0].src);
                }
              });
            }
          }

          /** 修正匹配内容 */
          const result = text.contentResult;
          const titleLen = result.title.length;
          const contentLen = result.content.length;
          const linkLen = result.link.length;
          let tmp = contentLen - titleLen;
          result.des = false;
          if (tmp > 0) {
            result.des = result.content.slice(0, tmp);
            result.content = result.content.slice(tmp, contentLen);
          }
          tmp = linkLen - titleLen;
          if (tmp > 0) {
            result.link = result.link.slice(tmp, linkLen);
          }


          $('#content').html(template.render(tplMap.indexTpl, result));

          if (text.workerresult.title.length > 0) {
            text.workerresult.hasworker = true;
          }
          $('#worker').html(template.render(tplMap.indexTpl, text.workerresult));
        }
      }
      $('.pagenation').html(template.render(tplMap.pagenationTpl, pagenation));
    })
    .fail((err) => {
      console.log(err);
    })
    .always(() => {
      $('main').loading('stop');
    });
}
/**
 * 邮件订阅
 * @param {*} input
 */
// eslint-disable-next-line
function SubscribeEmail(element, event) {
  const subEmailUrl = '/lists/248ba7cad4/members';
  const email = $.trim($(`#${element}`).val());
  const notifmsg = {
    info: {
      type: 'info',
      position: 'center',
      bgcolor: '#F5F5F5',
      color: '#44B99B',
      opacity: 0.8,
      msg: ''
    },
    error: {
      type: 'error',
      position: 'center',
      opacity: 0.8,
      msg: ''
    }
  };
  if (util.checkEmail(email)) {
    $('body').loading('start');
    $(event.target).attr('disabled', true);
    util
      .http(
        subEmailUrl,
        {
          email_address: email,
          status: 'subscribed',
          language: 'zh'
        },
        'POST'
      )
      .then(
        () => {
          notifmsg.info.msg = '成功订阅邮件感谢您的支持!';
          window.notif(notifmsg.info);
        },
        (err) => {
          if (err.responseJSON.title.indexOf('Exists') > -1) {
            notifmsg.info.msg = '您已经订阅，感谢您的支持!';
            window.notif(notifmsg.info);
          } else {
            notifmsg.error.msg = '订阅失败';
            window.notif(notifmsg.error);
          }
        }
      )
      .always(() => {
        $(event.target).attr('disabled', false);
        $('body').loading('stop');
      });
  } else {
    notifmsg.error.msg = '请输入正确的邮箱地址!';
    window.notif(notifmsg.error);
  }
}

function IndexInit() {
  template.defaults.minimize = true;
  template.defaults.imports.url = (value) => {
    try {
      const url = new URL(value);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return value;
    }
  };
  window.prePage = GetCampaigns;
  window.nextPage = GetCampaigns;
  $('body').loading({
    overlay: $('#windows8'),
    shownClass: 'showbody',
    start: false,
    onStart: () => false
  });
  $('main').loading({
    overlay: $('#fountainG'),
    shownClass: 'showmain',
    start: false,
    onStart: () => false
  });
  GetCampaigns();
}

const pageInitMap = {
  IndexInit
};
window.init = (param) => {
  if (pageInitMap[param]) {
    pageInitMap[param]();
  }
};
