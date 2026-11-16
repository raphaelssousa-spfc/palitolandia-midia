src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0040.jpg').convert('RGBA')
strip(im,"PARECE MENTIRA #13",90,'#e0453a',W,70,0)
strip(im,"HARVARD OU A",230,W,K,110,-3); strip(im,"GRAVIDADE:",400,'#a8323a',W,110,2); strip(im,"QUEM VEIO ANTES?",570,Y,K,95,-2)
burst(im,850,1450,165,"VOCÊ\nSABIA?",R,60); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
