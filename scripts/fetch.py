import json,urllib.request,urllib.parse,re,html
from opencc import OpenCC
cc=OpenCC('t2s')
order=[("内篇",["逍遙遊","齊物論","養生主","人間世","德充符","大宗師","應帝王"]),
("外篇",["駢拇","馬蹄","胠篋","在宥","天地","天道","天運","刻意","繕性","秋水","至樂","達生","山木","田子方","知北遊"]),
("杂篇",["庚桑楚","徐無鬼","則陽","外物","寓言","讓王","盜跖","說劍","漁父","列禦寇","天下"])]
out=[];n=0
for part,chs in order:
  for c in chs:
    n+=1
    u="https://zh.wikisource.org/w/api.php?action=parse&format=json&prop=text&page="+urllib.parse.quote("莊子/"+c)
    h=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"zhuangzi-book/1.0"})))["parse"]["text"]["*"]
    h=re.sub(r'(?s)<(table|style|script|sup)[^>]*>.*?</\1>','',h)
    h=re.sub(r'(?s)<div class="[^"]*(header|noprint|navbox|licen)[^"]*".*?</div>','',h)
    ps=[html.unescape(re.sub(r'<[^>]+>','',p)).strip() for p in re.findall(r'(?s)<p>(.*?)</p>',h)]
    ps=[cc.convert(p) for p in ps if len(p)>8]
    out.append({"no":n,"part":part,"title":cc.convert(c),"paragraphs":ps})
    print(n,cc.convert(c),len(ps),sum(map(len,ps)))
json.dump(out,open("content/zhuangzi.json","w"),ensure_ascii=False,indent=1)
