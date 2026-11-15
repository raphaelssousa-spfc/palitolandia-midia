src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0200.jpg').convert('RGBA')
strip(im,"PARECE MENTIRA #11",90,'#e0453a',W,70,0)
strip(im,"O T. REX",230,W,K,110,-3); strip(im,"CONHECEU O",400,'#3f8f3c',W,110,2); strip(im,"ESTEGOSSAURO?",570,Y,K,100,-2)
burst(im,850,1450,165,"VOCÊ\nSABIA?",R,60); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
