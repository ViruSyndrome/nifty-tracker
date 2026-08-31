import sys

with open("script.js", "r", encoding="utf-8") as f:
    content = f.read()

target = """    card.innerHTML = '<div class="result-header">'
      + '<div class="result-name-wrap">'
      + '<div class="result-name-row">'
      + '<h2 class="result-name">' + data.name + '</h2>'
      + '<button class="' + wlStarCls + '" data-sym="' + symbol + '" onclick="toggleWatchlist(\\'' + symbol + '\\', \\'' + safeName + '\\')">'
      + wlStarLbl + '</button>'
      + '</div>'"""

replacement = """    card.innerHTML = '<div class="result-header">'
      + '<div class="result-name-wrap">'
      + '<div class="result-name-row">'
      + '<h2 class="result-name">' + data.name + '</h2>'
      + '<div style="display:flex; gap: 8px; align-items:center;">'
      + '<a href="https://kite.zerodha.com/chart/web/tvc/NSE/' + symbol.replace(/\\.(NS|BO)$/, '') + '" target="_blank" class="kite-btn" style="background:#0052cc; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; text-decoration:none;">📈 Trade</a>'
      + '<button class="' + wlStarCls + '" data-sym="' + symbol + '" onclick="toggleWatchlist(\\'' + symbol + '\\', \\'' + safeName + '\\')">'
      + wlStarLbl + '</button>'
      + '</div>'
      + '</div>'"""

content = content.replace(target, replacement)

with open("script.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced!")
