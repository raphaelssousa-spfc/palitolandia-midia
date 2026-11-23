exec(open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0])
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0040.jpg').convert('RGBA')
strip(im,"VERDADE OU MITO? #2",90,'#7b3fe4',W,70,0)
strip(im,"DÁ PRA VER",240,W,K,110,-3); strip(im,"A MURALHA",410,Y,K,120,2); strip(im,"DO ESPAÇO?!",580,'#a8323a',W,115,-2)
burst(im,860,1450,165,"E AÍ?",'#7b3fe4',70); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
