'use strict';
/**
 * @author aha-oretama
 * @Date 2018/05/27.
 */
import Bugspots from 'github-bugspots';

/**
 * 画面要素、URLなどからパラメータを取得し、github-bugspotsを実行する。
 * @param callback 実行後のデータへの実行関数
 * @returns {*}
 */
function exeBugspots(callback) {
  const branch = document.querySelector('.branch-select-menu > button > span').innerHTML;
  
  const parseUrl = (url) => {
    const parts = url.split('/'); // https://github.com/aha-oretama/github-bugspots-extension
    const organization = parts[3];
    const repository = parts[4];
    return {organization, repository}
  };
  
  return chrome.storage.sync.get(['token','regex'], function(data) {
    const parse = parseUrl(location.href);
    return new Bugspots(parse.organization, parse.repository, data.token).analyze(branch, new RegExp(data.regex, "i"))
      .then(callback)
      .catch(e => {
        console.log(e);
      });
  });
}

function storeBugspotsData(bugspots) {
  return chrome.storage.local.set({'bugspots': bugspots}, function (data) {
    console.log('set bugspots: ' + data.bugspots);
  })
}

function turnOn() {
  return exeBugspots(function (data) {
    storeBugspotsData(data);
    addScore(data);
  });
}

function turnOff() {
  chrome.storage.local.remove('bugspots', function (data) {
    console.log('remove bugspots');
  });
  removeScore();
}

function addScore() {
  let fileNames = Array.from(document.querySelectorAll('td.content > span > a'), it => it.innerHTML);
  let ageSpans = document.querySelector('td.age > span').innerHTML;

  // 該当ページでなければスキップ
  if(!ageSpans) {
    return;
  }
  
  const url = location.href;
  chrome.storage.local.get('bugspots', function (data) {
    for(let spot of data.bugspots.spots) {
      for (let i = 0; i < fileNames.length; i++) {
        
        // The fileNames inclue only file's name , not include path. Therefore, concat url and fileNames.
        if((`${url}/${fileNames[i]}`).endsWith(spot.file)) {
          let score = document.createElement('a');
          score.className = 'score';
          score.innerHTML(`${spot.score}`);
          ageSpans[i].appendChild();
        }
      }
    }
  });
}

function removeScore() {
  let score = document.querySelector('a.score');
  if (score) {
    score.remove();
  }
}

(function onload() {
  const commitBar = document.getElementsByClassName('commit-tease')[0];
  if(!commitBar) {
    return
  }
  
  let div = document.createElement('div');
  div.className = 'github-bugspots-controller';
  let button = document.createElement('input');
  button.className = 'btn btn-sm gb-button gb-displayed';
  button.setAttribute("type", "image");
  button.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACLlBMVEUAAAAqstgqstgqstgrstgqstgqstgqstgqstgqstgqstgrstgqstgqstgqstgqstgqstgqstgqstgqstgsstkqstgqstgqstgqstgqstgsstkqstgqstgqstgpsdgqstgqstgqstgts9gqstgpstgqstgttNkpstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgpstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstgosdgqstgqstgqstgqstgqstgqstgqstgqstgqstgqstj///8rAbqCAAAAuHRSTlMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwdARpZ7UDEML8D59fT8oS4IP+bph0NJmvPXIQt18mhSPAOK7mIHKd/PKnjWxmY06b8RDL3AEov3aBzdnQQo1OAiW7/AOD7xuRZN9aEwDxY3vOgwMbTsz5KY2+KdHAEGkcvp4MpzABBibmFjb1YHTPTxOFv85S6O/c4SKub3agM4XXUACYZRLwMKAQsBWiMI7AAAAAFiS0dEuTq4FmAAAAAHdElNRQfiBwgXNCaQgicpAAAA6ElEQVQY02NgAANGbR0mBjhgZtHV0zcwNGKF8tmMTUzNzC0sraxt2MECHLZ29g6OTs4urm6cID6Xu4enF7e3j6+ff0AgD1CANyg4JDQsPCIyKjomlg8owB8Xn5CYtCM5JTUtPUMAKCCYmZWdk5uXX1BYVFwiBBQQFiktK6+orKquqa0TFQOZKl7f0NjU3NLa1t4hAbZWsrOru6e3r3+C1ERpiMtkJk2eMnXa9BkzZSF8OflZs+fMnTd/wUIFiICi0qLFS5YuW75ipbIKWEB11eo1a9et37Bxk5o61Hsam7dobt22XQvEBgCP3EJ9EpKLQwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOC0wNy0wOFQyMzo1MjozOC0wNDowMDdKhBkAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTgtMDctMDhUMjM6NTI6MzgtMDQ6MDBGFzylAAAAAElFTkSuQmCC");
  
  button.addEventListener('click', function (event) {
    let button = event.target;
    if (button.classList.contains('selected')) {
      button.classList.remove('selected');
      turnOff();
      removeScore();
    } else {
      button.classList.add('selected');
      turnOn();
    }
  });
  
  div.appendChild(button);
  commitBar.appendChild(div);
})();
