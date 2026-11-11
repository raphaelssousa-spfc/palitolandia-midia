from PIL import Image, ImageDraw, ImageFont
import math
FB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=lambda s: ImageFont.truetype(FB,s)
def strip(im,text,y,bg,fg,size,rot):
    pad=34; f=font(size); tmp=ImageDraw.Draw(im); w=int(tmp.textlength(text,font=f))
    while w>980-2*pad: size-=4; f=font(size); w=int(tmp.textlength(text,font=f))
    W,H=w+2*pad,size+2*pad-10
    l=Image.new('RGBA',(W+20,H+20),(0,0,0,0)); d=ImageDraw.Draw(l)
    d.rounded_rectangle((16,16,W+16,H+16),22,fill=(0,0,0,150)); d.rounded_rectangle((8,8,W,H),22,fill=bg,outline='#1a1030',width=9)
    d.text((8+pad,8+pad-14),text,font=f,fill=fg); l=l.rotate(rot,expand=True,resample=Image.BICUBIC)
    im.alpha_composite(l,(int((1080-l.width)/2),int(y)))
def burst(im,cx,cy,r,text,bg,size):
    l=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(l)
    pts=[(cx+(r if i%2==0 else r*0.78)*math.cos(i*math.pi/14),cy+(r if i%2==0 else r*0.78)*math.sin(i*math.pi/14)) for i in range(28)]
    d.polygon([(x+10,y+12) for x,y in pts],fill=(0,0,0,150)); d.polygon(pts,fill=bg,outline='#1a1030',width=9)
    lines=text.split('\n'); f=font(size); tot=len(lines)*size*1.05
    for i,t in enumerate(lines):
        w=d.textlength(t,font=f); d.text((cx-w/2,cy-tot/2+i*size*1.05-6),t,font=f,fill='#fff',stroke_width=6,stroke_fill='#1a1030')
    im.alpha_composite(l.rotate(-10,center=(cx,cy),resample=Image.BICUBIC))
def tag(im,y):
    d=ImageDraw.Draw(im); f=font(50); t="PALITOLÂNDIA.IA"; w=d.textlength(t,font=f)
    d.rounded_rectangle(((1080-w)/2-26,y,(1080+w)/2+26,y+82),38,fill='#ffd23f',outline='#1a1030',width=7); d.text(((1080-w)/2,y+10),t,font=f,fill='#1a1030')
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
C=[('micro-ondas',190,'O-chocolate-que-derreteu',[("UM CHOCOLATE",1060,Y,K,150,-3),("MUDOU O MUNDO?!",1280,R,W,120,2)],(860,880,170,"POR\nACIDENTE",'#26c281',56),1700),
 ('cleopatra',10,'Cleopatra-e-a-Lua',[("CLEÓPATRA VIVEU",300,W,K,110,-3),("MAIS PERTO DA",450,Y,K,120,2),("LUA",590,R,W,130,-2)],(880,1130,165,"FAÇA\nA CONTA",R,56),1700),
 ('sol',20,'O-Sol-sumiu',[("SE O SOL SUMISSE",560,W,K,112,-3),("NINGUÉM VERIA",740,Y,K,130,2),("POR 8 MIN!",930,R,W,150,-2)],(880,360,150,"VOCÊ\nSABIA?",'#7b3fe4',60),1700),
 ('torre',250,'Torre-Eiffel',[("A TORRE EIFFEL",1060,W,K,130,-3),("CRESCE NO VERÃO?!",1270,Y,K,112,2)],(860,700,175,"+15 CM",R,64),1530)]
for d,fr,name,strips,b,ty in C:
    im=Image.open(f'{d}/frames_v1/f0176.jpg' if d=='torre' else f'{d}/frames/f{fr:04d}.jpg').convert('RGB').resize((1080,1920)).convert('RGBA')
    for t,y,bg,fg,sz,rot in strips: strip(im,t,y,bg,fg,sz,rot)
    burst(im,*b); tag(im,ty); im.convert('RGB').save(f'capas/capa_{name}.png')
s=Image.new('RGB',(1440,640))
for i,c in enumerate(C): s.paste(Image.open(f'capas/capa_{c[2]}.png').resize((360,640)),(i*360,0))
s.save('/tmp/claude-0/-home-claude/2cfaaf34-a156-5758-88bd-e75a5e02f2dc/scratchpad/capas3.jpg')
