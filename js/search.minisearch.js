// =============================
// MiniSearch Search
// =============================

function getQueryParam(name) {
  return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

async function initSearch() {
  const response = await fetch('/index.json');
  const data = await response.json();

  const miniSearch = new MiniSearch({
    fields: ['title', 'contents', 'tags', 'categories'],
    storeFields: ['title', 'permalink', 'tags', 'categories', 'contents'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2
    }
  });

  miniSearch.addAll(data);

  const input = document.getElementById('search-query');
  const resultsBox = document.getElementById('search-results');
  const loading = document.querySelector('.search-loading');
  const query = getQueryParam('q');

  if (query) {
    input.value = query;
    performSearch(query);
  } else {
    hide(loading);
    resultsBox.innerHTML = '<p class="search-results-empty">请输入关键词或浏览 <a href="/tags/">所有标签</a>。</p>';
  }

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(input.value.trim());
    }, 200);
  });

  function performSearch(keyword) {
    show(loading);
    const results = miniSearch.search(keyword);
    resultsBox.innerHTML = '';

    if (results.length > 0) {
      results.forEach((result, key) => {
        const snippet = result.contents.substring(0, 360) + '&hellip;';
        let tags = '';
        if (result.tags) {
          result.tags.forEach(tag => {
            tags += "<a href='/tags/" + tag.toLowerCase() + "'>#" + tag + "</a> ";
          });
        }

        const output = render(document.getElementById("search-result-template").innerHTML, {
          key: key,
          title: result.title,
          link: result.permalink,
          tags: tags,
          categories: result.categories,
          snippet: snippet
        });

        const div = document.createElement('div');
        div.innerHTML = output;
        resultsBox.appendChild(div);
      });

      const markInstance = new Mark(resultsBox);
      markInstance.unmark();
      markInstance.mark(keyword);
    } else {
      resultsBox.innerHTML = '<p class="search-results-empty">未找到匹配内容。</p>';
    }
    hide(loading);
  }
}

function render(templateString, data) {
  var conditionalMatches, conditionalPattern, copy;
  conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*\}/g;
  copy = templateString;
  while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
    if (data[conditionalMatches[1]]) {
      copy = copy.replace(conditionalMatches[0], conditionalMatches[2]);
    } else {
      copy = copy.replace(conditionalMatches[0], '');
    }
  }
  templateString = copy;
  for (var key in data) {
    var find = '\$\{\s*' + key + '\s*\}';
    var re = new RegExp(find, 'g');
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
}

function show(elem) {
  if (elem) elem.style.display = 'block';
}
function hide(elem) {
  if (elem) elem.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initSearch);