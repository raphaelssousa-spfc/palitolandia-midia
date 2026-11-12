src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0120.jpg').convert('RGBA')
strip(im,"O QUE VEIO PRIMEIRO:",200,W,K,96,-3); strip(im,"O FÓSFORO",370,R,W,130,2); strip(im,"OU O ISQUEIRO?",560,Y,K,120,-2)
burst(im,850,1450,165,"VOCÊ\nSABIA?",'#2f6fb2',60); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
