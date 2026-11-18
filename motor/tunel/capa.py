exec(open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0])
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0040.jpg').convert('RGBA')
strip(im,"VERDADE OU MITO? #1",90,'#7b3fe4',W,70,0)
strip(im,"LADRÕES CAVARAM",240,W,K,105,-3); strip(im,"UM TÚNEL ATÉ",410,Y,K,115,2); strip(im,"UM BANCO?!",580,'#a8323a',W,120,-2)
burst(im,860,1450,165,"E AÍ?",'#7b3fe4',70); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
