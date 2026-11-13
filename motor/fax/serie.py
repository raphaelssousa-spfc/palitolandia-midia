exec(open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0])
from PIL import Image, ImageDraw
im=Image.new('RGBA',(1080,1920),(0,0,0,0)); d=ImageDraw.Draw(im); f=font(46); t="PARECE MENTIRA #8"; w=d.textlength(t,font=f)
d.rounded_rectangle((44,96,44+w+52,96+80),30,fill=(0,0,0,140)); d.rounded_rectangle((36,88,36+w+52,88+80),30,fill='#e0453a',outline='#1a1030',width=7)
d.text((62,100),t,font=f,fill='#fff'); im.save('serie.png')
