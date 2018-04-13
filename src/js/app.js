const BASE_URL = 'http://localhost:3000/3.0';

function Utils() {
  this.baseurl = BASE_URL;
  this.AjaxBeforeSend = (request) => {
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
  if (str == null || string == null || str === '' || string.length === 0 || str.length > string.length) {
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
    name: [],
    require: [],
    link: []
  };
  worker.forEach((v) => {
    const arr = v.split('\n');
    arr.forEach((data) => {
      if (data.indexOf(' —— ') > -1) {
        workerresult.name.push(data);
      } else if (/^\d*K-\d*K/.test(data)) {
        workerresult.require.push(data);
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
const tplMap = {
  content: `
            <%for (var i = 0; i < title.length; i++) {%>
              <article>
                  <h4><%=title[i]%></h4>
                  <p><%=content[i]%></p>
                  <a href="<%=link[i]%>">zhihu.com</a>
              </article>
            <%}%>
            `,
  worker: ''
};
function GetCampaigns(nextpage = 1) {
  const page = typeof nextpage === 'number' ? nextpage : 1;
  const count = 1;
  const offset = (page - 1) * count;
  util.http('/campaigns', {
    sort_field: 'send_time',
    sort_dir: 'DESC',
    count,
    offset
  }).then((data) => {
    const id = data.campaigns[0].id || '';
    if (id) {
      return util.http(`/campaigns/${id}/content`);
    }
    throw Error('id is require');
  }).then((data) => {
    if (data && data.plain_text) {
      const text = util.plainText(data.plain_text);
      console.log(text);
      if (text && text.contentResult) {
        const html = template(tplMap.content, text.contentResult);
        $('#content').html(html);
      }
    }
  }).fail((err) => {
    console.log(err);
  });
}
function IndexInit() {
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

