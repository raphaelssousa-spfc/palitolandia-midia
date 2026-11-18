exec(open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0])
from PIL import Image, ImageDraw
im=Image.new('RGBA',(1080,1920),(0,0,0,0)); d=ImageDraw.Draw(im); f=font(40); t="VERDADE OU MITO? #1"; w=d.textlength(t,font=f)
d.rounded_rectangle((44,36,44+w+48,36+70),28,fill=(0,0,0,140)); d.rounded_rectangle((36,28,36+w+48,28+70),28,fill='#7b3fe4',outline='#1a1030',width=7)
d.text((60,40),t,font=f,fill='#fff'); im.save('serie.png')
