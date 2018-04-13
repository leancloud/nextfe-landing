const BASE_URL = 'http://localhost:3000/3.0';
const tplMap = {
  indexTpl: `
          {{if hasworker}}
            <article>
              <span class="button">工作机会</span>
            </article>
          {{/if}}
          {{each title}}
            <article>
                <h4>{{title[$index]}}</h4>
                <p>{{content[$index]}}</p>
                <a href="{{link[$index]}}" target="_blank">
                {{link[$index] | url}}</a>
            </article>
          {{/each}}`,
  pagenationTpl: `
              <span class="page-button pre" onClick="nextPage({{current-1}})">上一页</span>
              <span>{{current}}/{{total}}</span>
              <span class="page-button next" onClick="prePage({{current+1}})">下一页</span>`
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
  const worker = textArr[1].split('\n\n');
  content.shift();
  const contentResult = {
    title: [],
    content: [],
    link: []
  };
  content.forEach((v) => {
    v.split('\n').forEach((valstr) => {
      const value = valstr.replace(/^-*/, '');
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
  worker.forEach((v) => {
    const arr = v.split('\n');
    arr.forEach((data) => {
      if (data.indexOf(' —— ') > -1) {
        workerresult.title.push(data);
      } else if (/^\d*K-\d*K/.test(data)) {
        workerresult.content.push(data);
      } else if (this.checkURL(data)) {
        // eslint-disable-next-line
        const objExp = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
        workerresult.link.push(data.match(objExp)[0]);
      }
    });
  });
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
  $('main').loading({ overlay: $('#fountainG'), shownClass: 'show', start: true });
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
          $('#content').html(template.render(tplMap.indexTpl, text.contentResult));
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
      $('main').loading('destroy');
    });
}

function SubscribeEmail(input) {
  const subEmailUrl = '/lists/248ba7cad4/members';
  const email = $.trim($(`#${input}`).val());
  if (util.checkEmail(email)) {
    $('body').loading({ overlay: $('#windows8'), shownClass: 'show', start: true });
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
          window.notif({
            type: 'info',
            msg: '成功订阅邮件感谢您的支持!',
            position: 'center',
            bgcolor: '#F5F5F5',
            color: '#44B99B',
            opacity: 0.8
          });
        },
        (err) => {
          console.log(err.responseJSON.title);
          console.log(err.responseJSON.title.indexOf('Exists') > -1);
          if (err.responseJSON.title.indexOf('Exists') > -1) {
            window.notif({
              type: 'info',
              msg: '您已经订阅，感谢您的支持!',
              position: 'center',
              bgcolor: '#F5F5F5',
              color: '#44B99B',
              opacity: 0.8
            });
          } else {
            window.notif({
              type: 'error',
              msg: '订阅失败!',
              position: 'center',
              opacity: 0.8
            });
          }
        }
      )
      .always(() => {
        $('body').loading('destroy');
      });
  } else {
    console.log('error email');
  }
}

function IndexInit() {
  // 模版压缩
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
